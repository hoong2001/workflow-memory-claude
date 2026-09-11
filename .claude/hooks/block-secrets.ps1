<#
.SYNOPSIS
  PreToolUse guard: refuse to write credentials into memory / workflow documents.

.DESCRIPTION
  Reads the Claude Code hook payload from stdin, extracts only the INCOMING text of
  the tool call, and denies the call when that text carries a real-looking credential.

  Scope (deliberately narrow - see .claude/rules/workspace-no-secrets.md):
    - anything under project-memory/
    - anything under .claude/
    - any .md file
  Application source and config files (Web.config, appsettings.json, .env) are NOT
  scanned; a connection string legitimately belongs there.

  Self-exempt paths - the guard's own toolkit quotes the patterns it hunts for:
    .claude/hooks/, .claude/skills/wp-secret-scan/, .claude/rules/workspace-no-secrets.md

  Fails OPEN: any parse or runtime error exits 0 and allows the call. This is a guard
  against accidental leaks, not a control against a hostile actor - a bug in this
  script must never brick the workspace.

.PARAMETER ScanRoot
  Audit mode, used by /wp-secret-scan: walk this folder instead of reading stdin, and
  print every line in scope that carries a credential. The detection patterns live here
  once so the hook and the audit can never drift apart.
#>

param(
    [string[]]$ScanRoot
)

$ErrorActionPreference = 'Stop'

# ---------- scope ----------

function Test-GuardedPath {
    param([string]$Path)
    if ([string]::IsNullOrWhiteSpace($Path)) { return $false }
    $p = $Path.Replace([char]92, '/')

    # the guard's own files quote these patterns on purpose
    if ($p -match '(?i)(^|/)\.claude/hooks/')                          { return $false }
    if ($p -match '(?i)(^|/)\.claude/skills/wp-secret-scan/')          { return $false }
    if ($p -match '(?i)(^|/)\.claude/rules/workspace-no-secrets\.md$') { return $false }

    if ($p -match '(?i)(^|/)project-memory/') { return $true }
    if ($p -match '(?i)(^|/)\.claude/')       { return $true }
    if ($p -match '(?i)\.md$')                { return $true }
    return $false
}

# ---------- detection ----------

# A value that is obviously a stand-in, not a credential.
$placeholderRe = '^\s*["'']?\s*(?:<|\{|\$|%|\[|\*{2,}|x{3,}|X{3,}|\.{3}|…|-{3,}|your|my|the|changeme|change_me|redact|placeholder|example|sample|dummy|fake|test|todo|tbd|n/?a|none|null|nil|empty|true|false|"")'

# key = value, ASCII
$kvRe = '(?i)\b(pass(?:word|wd)|pwd|secret|api[-_ ]?key|apikey|access[-_ ]?token|auth[-_ ]?token|refresh[-_ ]?token|client[-_ ]?secret|private[-_ ]?key|credentials?)\b\s*[:=]\s*(\S+)'

# A connection string is NOT a key here on purpose: one that carries a real password is
# already caught by the Password= / Pwd= inside it, while matching the whole value fires
# on fully-placeholdered examples such as Server=<SERVER>;Password=<PASSWORD>.

# key = value, Chinese
$kvCjkRe = '(密碼|密码|口令|通行證|通行证|金鑰|金钥|密鑰|密钥)\s*[:：=＝]\s*(\S+)'

# High-confidence token shapes - no key needed, the shape alone is the tell.
$tokenRes = [ordered]@{
    'Anthropic API key'   = 'sk-ant-[A-Za-z0-9_\-]{20,}'
    'OpenAI-style key'    = 'sk-[A-Za-z0-9]{32,}'
    'GitHub token'        = 'gh[pousr]_[A-Za-z0-9]{30,}'
    'AWS access key id'   = 'AKIA[0-9A-Z]{16}'
    'Google API key'      = 'AIza[0-9A-Za-z_\-]{35}'
    'Slack token'         = 'xox[baprs]-[0-9A-Za-z\-]{10,}'
    'PEM private key'     = '-----BEGIN [A-Z ]*PRIVATE KEY-----'
    'JWT'                 = 'eyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}'
}

function Get-Mask {
    param([string]$Value)
    $v = $Value.Trim('"', "'", ',', ';', ')')
    if ($v.Length -le 4) { return ('*' * $v.Length) }
    return $v.Substring(0, 2) + ('*' * [Math]::Min(10, $v.Length - 2))
}

function Find-Secret {
    param([string]$Text)
    $hits = @()
    if ([string]::IsNullOrWhiteSpace($Text)) { return $hits }

    foreach ($m in [regex]::Matches($Text, $kvRe)) {
        $val = $m.Groups[2].Value
        if ($val.Length -lt 4) { continue }
        if ($val -match $placeholderRe) { continue }
        $hits += ("{0} = {1}" -f $m.Groups[1].Value, (Get-Mask $val))
    }
    foreach ($m in [regex]::Matches($Text, $kvCjkRe)) {
        $val = $m.Groups[2].Value
        if ($val.Length -lt 4) { continue }
        if ($val -match $placeholderRe) { continue }
        $hits += ("{0} = {1}" -f $m.Groups[1].Value, (Get-Mask $val))
    }
    foreach ($name in $tokenRes.Keys) {
        foreach ($m in [regex]::Matches($Text, $tokenRes[$name])) {
            $hits += ("{0}: {1}" -f $name, (Get-Mask $m.Value))
        }
    }
    return $hits
}

# ---------- audit mode (/wp-secret-scan) ----------

if ($ScanRoot) {
    $found = 0
    foreach ($root in $ScanRoot) {
        if (-not (Test-Path -LiteralPath $root)) { continue }
        Get-ChildItem -LiteralPath $root -Recurse -File -ErrorAction SilentlyContinue |
            Where-Object { Test-GuardedPath $_.FullName } |
            ForEach-Object {
                $file = $_.FullName
                $n = 0
                foreach ($line in (Get-Content -LiteralPath $file -ErrorAction SilentlyContinue)) {
                    $n++
                    foreach ($hit in (Find-Secret $line)) {
                        $found++
                        Write-Output ("{0}:{1}: {2}" -f $file, $n, $hit)
                    }
                }
            }
    }
    Write-Output ("--- {0} suspected credential(s)" -f $found)
    exit 0
}

# ---------- hook mode (PreToolUse, stdin) ----------

try {
    $raw = [Console]::In.ReadToEnd()
    if ([string]::IsNullOrWhiteSpace($raw)) { exit 0 }

    $payload = $raw | ConvertFrom-Json
    $tool    = [string]$payload.tool_name
    $ti      = $payload.tool_input
    if ($null -eq $ti) { exit 0 }

    $texts  = @()
    $target = ''

    if ($tool -eq 'Bash' -or $tool -eq 'PowerShell') {
        # No file_path to test - a heredoc or sed can land anywhere. Scan the command
        # only when it names something inside the guarded scope.
        $cmd = [string]$ti.command
        # The guard's own toolkit quotes these patterns - exempt it here too, not only in
        # the file_path branch, or the guard blocks every edit to itself.
        $selfEdit = $cmd -match '(?i)(\.claude/hooks/|\.claude/skills/wp-secret-scan/|workspace-no-secrets\.md)'
        if (-not $selfEdit -and $cmd -match '(?i)(project-memory|\.claude|\.md\b)') {
            $texts += $cmd
            $target = 'a shell command targeting memory / workflow files'
        }
    }
    else {
        $path = [string]$ti.file_path
        if ([string]::IsNullOrWhiteSpace($path)) { $path = [string]$ti.notebook_path }
        if (Test-GuardedPath $path) {
            $target = $path
            # INCOMING text only. old_string is never scanned, so redacting a secret
            # that is already on disk stays possible.
            foreach ($f in @('content', 'new_string', 'new_source')) {
                $v = $ti.$f
                if ($v) { $texts += [string]$v }
            }
            if ($ti.edits) {
                foreach ($e in $ti.edits) { if ($e.new_string) { $texts += [string]$e.new_string } }
            }
        }
    }

    if ($texts.Count -eq 0) { exit 0 }

    $hits = @()
    foreach ($t in $texts) { $hits += Find-Secret $t }
    if ($hits.Count -eq 0) { exit 0 }

    $list = ($hits | Select-Object -Unique -First 5) -join '; '
    $reason = @"
Blocked by the no-secrets guard: this write puts what looks like a live credential into $target.
Masked match(es): $list
Memory and workflow documents are committed to git and synced across machines - a credential written here is leaked permanently.
Rewrite the value as a placeholder (<REDACTED>, <API_KEY>, <PASSWORD>) and name where the real value lives (Web.config, a secret store, the ops runbook) instead of the value itself. See .claude/rules/workspace-no-secrets.md.
"@

    $out = @{
        hookSpecificOutput = @{
            hookEventName            = 'PreToolUse'
            permissionDecision       = 'deny'
            permissionDecisionReason = $reason
        }
    } | ConvertTo-Json -Depth 5 -Compress

    Write-Output $out
    exit 0
}
catch {
    # Fail open, but say so - a silent guard is worse than no guard.
    Write-Error ("block-secrets.ps1 failed, write allowed: " + $_.Exception.Message)
    exit 0
}
