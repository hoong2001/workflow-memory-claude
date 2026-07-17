# run-sql.ps1 — execute CRUD-ONLY SQL against the connection string in Web.config.
# Hard whitelist: SELECT / INSERT / UPDATE / DELETE (+ WITH/DECLARE/SET helpers). Everything else is rejected.
# Exit codes: 0 = ok, 3 = query rejected by whitelist, 4 = connection resolution error, 5 = SQL execution error.
param(
    [Parameter(Mandatory = $true)][string]$Query,
    [string]$WebConfigPath,        # path to the Web project's Web.config
    [string]$ConnectionName,       # connectionStrings/add[@name] to use; optional if only one exists
    [string]$ConnectionString,     # direct override; skips Web.config parsing
    [int]$TimeoutSeconds = 30,
    [switch]$AllowNoWhere,         # override the UPDATE/DELETE-without-WHERE guard (use deliberately)
    [switch]$AsJson,               # output result sets as JSON instead of a table
    [switch]$ValidateOnly          # run the whitelist check only; do not connect
)

$ErrorActionPreference = "Stop"

# ---------- 1. CRUD whitelist validation ----------
# Work on a copy with string literals and comments stripped, so keywords inside them don't false-positive.
$text = $Query
$text = [regex]::Replace($text, "'([^']|'')*'", "''")      # string literals
$text = [regex]::Replace($text, "/\*[\s\S]*?\*/", " ")     # block comments
$text = [regex]::Replace($text, "--[^\r\n]*", " ")         # line comments

$forbidden = @('DROP','ALTER','CREATE','TRUNCATE','GRANT','REVOKE','DENY','EXEC','EXECUTE','MERGE',
               'BACKUP','RESTORE','DBCC','SHUTDOWN','KILL','OPENROWSET','OPENQUERY','RECONFIGURE','USE')
foreach ($kw in $forbidden) {
    if ($text -match "(?i)(?<![\w@#$])$kw\b") {
        Write-Host "REJECTED: forbidden keyword '$kw' — this skill allows CRUD only (SELECT/INSERT/UPDATE/DELETE)."
        exit 3
    }
}
if ($text -match "(?i)\b(xp_|sp_)\w+") {
    Write-Host "REJECTED: system procedure call detected — CRUD only."
    exit 3
}
# SELECT ... INTO creates a table (DDL in disguise); INTO is only legal right after INSERT.
if ($text -match "(?i)(?<!\bINSERT\s{1,20})\bINTO\b") {
    Write-Host "REJECTED: 'INTO' outside INSERT (SELECT ... INTO creates a table) — CRUD only."
    exit 3
}
$firstKeyword = [regex]::Match($text, "(?i)[A-Za-z]+").Value.ToUpperInvariant()
$allowedStart = @('SELECT','INSERT','UPDATE','DELETE','WITH','DECLARE','SET','IF','BEGIN')
if ($allowedStart -notcontains $firstKeyword) {
    Write-Host "REJECTED: statement starts with '$firstKeyword' — must start with one of: $($allowedStart -join ', ')."
    exit 3
}
# Guard against accidental mass modification: any UPDATE/DELETE present requires a WHERE somewhere.
if (-not $AllowNoWhere -and $text -match "(?i)\b(UPDATE|DELETE)\b" -and $text -notmatch "(?i)\bWHERE\b") {
    Write-Host "REJECTED: UPDATE/DELETE without WHERE. Add a WHERE clause, or pass -AllowNoWhere if truly intended."
    exit 3
}

if ($ValidateOnly) {
    Write-Host "VALIDATION PASSED (CRUD whitelist)"
    exit 0
}

# ---------- 2. Resolve the connection string ----------
if (-not $ConnectionString) {
    if (-not $WebConfigPath) {
        Write-Host "ERROR: provide -WebConfigPath (or -ConnectionString)."
        exit 4
    }
    if (-not (Test-Path $WebConfigPath)) {
        Write-Host "ERROR: Web.config not found: $WebConfigPath"
        exit 4
    }
    [xml]$config = Get-Content -Raw $WebConfigPath
    $adds = @($config.configuration.connectionStrings.add)
    if (-not $adds -or $adds.Count -eq 0) {
        Write-Host "ERROR: no <connectionStrings> entries found in $WebConfigPath"
        exit 4
    }
    if ($ConnectionName) {
        $entry = $adds | Where-Object { $_.name -eq $ConnectionName } | Select-Object -First 1
        if (-not $entry) {
            Write-Host "ERROR: connection '$ConnectionName' not found. Available: $(($adds | ForEach-Object { $_.name }) -join ', ')"
            exit 4
        }
    } elseif ($adds.Count -eq 1) {
        $entry = $adds[0]
    } else {
        Write-Host "ERROR: multiple connection strings found — pass -ConnectionName. Available: $(($adds | ForEach-Object { $_.name }) -join ', ')"
        exit 4
    }
    $ConnectionString = $entry.connectionString
    Write-Host "Connection: $($entry.name)"
}

# ---------- 3. Execute ----------
Add-Type -AssemblyName System.Data
$conn = New-Object System.Data.SqlClient.SqlConnection($ConnectionString)
try {
    $conn.Open()
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = $Query
    $cmd.CommandTimeout = $TimeoutSeconds

    if ($firstKeyword -in @('SELECT', 'WITH')) {
        $adapter = New-Object System.Data.SqlClient.SqlDataAdapter($cmd)
        $dataSet = New-Object System.Data.DataSet
        [void]$adapter.Fill($dataSet)
        foreach ($table in $dataSet.Tables) {
            Write-Host "--- result set: $($table.Rows.Count) row(s) ---"
            if ($AsJson) {
                $rows = @($table | Select-Object $($table.Columns | ForEach-Object { $_.ColumnName }))
                $rows | ConvertTo-Json -Depth 4
            } else {
                $table | Format-Table -AutoSize | Out-String -Width 4096 | Write-Host
            }
        }
    } else {
        $affected = $cmd.ExecuteNonQuery()
        Write-Host "OK: $affected row(s) affected."
    }
    exit 0
} catch {
    Write-Host "SQL ERROR: $($_.Exception.Message)"
    exit 5
} finally {
    $conn.Dispose()
}
