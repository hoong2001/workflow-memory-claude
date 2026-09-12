#!/usr/bin/env node
/**
 * PreToolUse guard: refuse to write credentials into memory / workflow documents.
 *
 * Reads the Claude Code hook payload from stdin, extracts only the INCOMING text of the
 * tool call, and denies the call when that text carries a real-looking credential.
 *
 * Runtime: Node.js, chosen over PowerShell so one implementation behaves identically on
 * Windows, WSL, macOS and Linux. Hooks are not PowerShell-only - `shell` accepts bash or
 * powershell, and the `args` exec form spawns any executable with no shell at all.
 *
 * Scope (deliberately narrow - see .claude/rules/workspace-no-secrets.md):
 *   - anything under project-memory/
 *   - anything under .claude/
 *   - any .md file
 * Application source and config (Web.config, appsettings.json, .env) are NOT scanned;
 * a connection string legitimately belongs there.
 *
 * Self-exempt paths - the guard's own toolkit quotes the patterns it hunts for:
 *   .claude/hooks/, .claude/skills/wp-secret-scan/, .claude/rules/workspace-no-secrets.md
 *
 * Audit mode (used by /wp-secret-scan):
 *   node block-secrets.mjs project-memory .claude CLAUDE.md
 * Walks those roots instead of reading stdin and prints every offending line. The
 * detection patterns live here once, so the live guard and the sweep cannot drift.
 *
 * Fails OPEN: any parse or runtime error exits 0 and allows the call. This is a guard
 * against accidental leaks, not a control against a hostile actor - a bug here must
 * never brick the workspace.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const BACKSLASH = String.fromCharCode(92);

// ---------- scope ----------

function normalize(p) {
  return p.split(BACKSLASH).join('/');
}

function isGuarded(path) {
  if (!path) return false;
  const p = normalize(path);

  // the guard's own files quote these patterns on purpose
  if (/(^|\/)\.claude\/hooks\//i.test(p)) return false;
  if (/(^|\/)\.claude\/skills\/wp-secret-scan\//i.test(p)) return false;
  if (/(^|\/)\.claude\/rules\/workspace-no-secrets\.md$/i.test(p)) return false;

  if (/(^|\/)project-memory\//i.test(p)) return true;
  if (/(^|\/)\.claude\//i.test(p)) return true;
  if (/\.md$/i.test(p)) return true;
  return false;
}

// ---------- detection ----------

// A value that is obviously a stand-in, not a credential.
const PLACEHOLDER =
  /^\s*["']?\s*(?:<|\{|\$|%|\[|\*{2,}|x{3,}|\.{3}|…|-{3,}|your|my|the|changeme|change_me|redact|placeholder|example|sample|dummy|fake|test|todo|tbd|n\/?a|none|null|nil|empty|true|false|"")/i;

// key = value, ASCII.
// A connection string is NOT a key here on purpose: one that carries a real password is
// already caught by the Password= / Pwd= inside it, while matching the whole value fires
// on fully-placeholdered examples such as Server=<SERVER>;Password=<PASSWORD>.
const KV_SRC =
  '\\b(pass(?:word|wd)|pwd|secret|api[-_ ]?key|apikey|access[-_ ]?token|auth[-_ ]?token|refresh[-_ ]?token|client[-_ ]?secret|private[-_ ]?key|credentials?)\\b\\s*[:=]\\s*(\\S+)';

// key = value, Chinese. No \b here - CJK characters are word characters, so a boundary
// assertion around them does not behave the way it does for ASCII keys.
const KV_CJK_SRC = '(密碼|密码|口令|通行證|通行证|金鑰|金钥|密鑰|密钥)\\s*[:：=＝]\\s*(\\S+)';

// High-confidence token shapes - no key needed, the shape alone is the tell.
const TOKENS = [
  ['Anthropic API key', 'sk-ant-[A-Za-z0-9_-]{20,}'],
  ['OpenAI-style key', 'sk-[A-Za-z0-9]{32,}'],
  ['GitHub token', 'gh[pousr]_[A-Za-z0-9]{30,}'],
  ['AWS access key id', 'AKIA[0-9A-Z]{16}'],
  ['Google API key', 'AIza[0-9A-Za-z_-]{35}'],
  ['Slack token', 'xox[baprs]-[0-9A-Za-z-]{10,}'],
  ['PEM private key', '-----BEGIN [A-Z ]*PRIVATE KEY-----'],
  ['JWT', 'eyJ[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9_-]{10,}'],
];

function mask(value) {
  const v = value.replace(/^["']+/, '').replace(/["',;)]+$/, '');
  if (v.length <= 4) return '*'.repeat(v.length);
  return v.slice(0, 2) + '*'.repeat(Math.min(10, v.length - 2));
}

function findSecrets(text) {
  const hits = [];
  if (!text) return hits;

  for (const src of [KV_SRC, KV_CJK_SRC]) {
    const re = new RegExp(src, src === KV_SRC ? 'gi' : 'g');
    for (const m of text.matchAll(re)) {
      const value = m[2];
      if (!value || value.length < 4) continue;
      if (PLACEHOLDER.test(value)) continue;
      hits.push(`${m[1]} = ${mask(value)}`);
    }
  }
  for (const [name, src] of TOKENS) {
    for (const m of text.matchAll(new RegExp(src, 'g'))) {
      hits.push(`${name}: ${mask(m[0])}`);
    }
  }
  return hits;
}

// ---------- audit mode (/wp-secret-scan) ----------

function* walk(root) {
  let st;
  try {
    st = statSync(root);
  } catch {
    return;
  }
  if (st.isFile()) {
    yield root;
    return;
  }
  if (!st.isDirectory()) return;
  let entries;
  try {
    entries = readdirSync(root, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.name === '.git' || e.name === 'node_modules') continue;
    yield* walk(join(root, e.name));
  }
}

function audit(roots) {
  let found = 0;
  for (const root of roots) {
    for (const file of walk(root)) {
      if (!isGuarded(file)) continue;
      let lines;
      try {
        lines = readFileSync(file, 'utf8').split(/\r?\n/);
      } catch {
        continue;
      }
      lines.forEach((line, i) => {
        for (const hit of findSecrets(line)) {
          found++;
          console.log(`${normalize(file)}:${i + 1}: ${hit}`);
        }
      });
    }
  }
  console.log(`--- ${found} suspected credential(s)`);
}

// ---------- hook mode (PreToolUse, stdin) ----------

function hook() {
  let raw = '';
  try {
    raw = readFileSync(0, 'utf8');
  } catch {
    return;
  }
  if (!raw.trim()) return;

  const payload = JSON.parse(raw);
  const tool = String(payload.tool_name || '');
  const ti = payload.tool_input;
  if (!ti) return;

  const texts = [];
  let target = '';

  if (tool === 'Bash' || tool === 'PowerShell') {
    // No file_path to test - a heredoc or sed can land anywhere. Scan the command only
    // when it names something inside the guarded scope, and never when it is editing the
    // guard's own toolkit.
    const cmd = String(ti.command || '');
    const selfEdit =
      /\.claude\/hooks\/|\.claude\/skills\/wp-secret-scan\/|workspace-no-secrets\.md/i.test(cmd);
    if (!selfEdit && /project-memory|\.claude|\.md\b/i.test(cmd)) {
      texts.push(cmd);
      target = 'a shell command targeting memory / workflow files';
    }
  } else {
    const path = String(ti.file_path || ti.notebook_path || '');
    if (isGuarded(path)) {
      target = path;
      // INCOMING text only. old_string is never scanned, so redacting a secret that is
      // already on disk stays possible.
      for (const field of ['content', 'new_string', 'new_source']) {
        if (ti[field]) texts.push(String(ti[field]));
      }
      if (Array.isArray(ti.edits)) {
        for (const e of ti.edits) if (e && e.new_string) texts.push(String(e.new_string));
      }
    }
  }

  if (texts.length === 0) return;

  const hits = [...new Set(texts.flatMap(findSecrets))].slice(0, 5);
  if (hits.length === 0) return;

  const reason = [
    `Blocked by the no-secrets guard: this write puts what looks like a live credential into ${target}.`,
    `Masked match(es): ${hits.join('; ')}`,
    'Memory and workflow documents are committed to git and synced across machines - a credential written here is leaked permanently.',
    'Rewrite the value as a placeholder (<REDACTED>, <API_KEY>, <PASSWORD>) and name where the real value lives (Web.config, a secret store, the ops runbook) instead of the value itself. See .claude/rules/workspace-no-secrets.md.',
  ].join('\n');

  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: reason,
      },
    })
  );
}

// ---------- entry ----------

try {
  const roots = process.argv.slice(2);
  if (roots.length > 0) audit(roots);
  else hook();
} catch (err) {
  // Fail open, but say so - a silent guard is worse than no guard.
  console.error(`block-secrets.mjs failed, write allowed: ${err && err.message}`);
}
process.exit(0);
