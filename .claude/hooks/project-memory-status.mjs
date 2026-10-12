#!/usr/bin/env node
/**
 * PostToolUse: regenerate project-memory/project-memory-status.md — one system-wide table of
 * every module plan that is not Done. Done plans are left out, so the file grows with live
 * work only and shrinks back as plans close.
 *
 * The plans stay the source of truth (.claude/skills/_shared-conventions.md → Status header).
 * The output is a derived view: never edited by hand, rebuilt from the headers whenever a
 * write lands on a module plan, so it cannot drift from them.
 *
 * Runtime: Node.js, so one implementation behaves identically on Windows, WSL, macOS and Linux.
 *
 * Trigger scope (hook mode, payload on stdin):
 *   - Write / Edit / MultiEdit whose file_path is project-memory/modules/<m>/plans/<file>.md
 *   - Bash / PowerShell whose command names project-memory/modules or a plans/ folder
 *     (a git mv, a rename, a delete — no file_path to test, and rebuilding is cheap)
 *
 * Manual mode — after editing a plan outside Claude, or on a fresh clone:
 *   node .claude/hooks/project-memory-status.mjs --regenerate
 *
 * Scan: project-memory/modules/<m>/plans/*.md, skipping names that start with "_" (the
 * folder's _README.md quotes an example header). Only the first 10 lines of a plan are read,
 * because the header sits directly under the H1.
 *
 * The file is rewritten only when its content changes, and it carries no timestamp, so a
 * write that leaves every header as it was produces no git diff.
 *
 * Optional cross-project mirror: when this machine has a vault path configured (the
 * wp-obsidian-progress-log skill's references/vault-path.local.json, else
 * ~/.claude/progress-vault.json — both { "vaultPath": "..." }), the same render() output is
 * also written to <vault>/Project Progress/<project>/_plans.md (plus frontmatter, plan links
 * as file:/// URLs), and <vault>/Project Progress/_Live plans.md is rebuilt by copying every
 * project's table block verbatim under a heading per project. One table format, owned by
 * render() and TABLE_FORMAT — the board has none of its own. Plain Markdown, so Obsidian is
 * optional. No config → skipped silently.
 *
 * Fails OPEN: any error exits 0. A broken status view must never block a write.
 *
 * The table is a contract: the plan-status mod (master repo: .claude/mods/plan-status/hooks/parse.ts)
 * reads it to show live plans above the prompt. Its shape is fixed by TABLE_FORMAT:
 *   <!-- TABLE_FORMAT -->
 *   | Module | Plan | Status | Detail | Updated |   (Plan as [file](link), `|` escaped as `\|`)
 * Change a column, its order or its escaping → bump TABLE_FORMAT and update parse.ts in the
 * same commit; the mod refuses a marker it does not know instead of misreading the rows.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BACKSLASH = String.fromCharCode(92);
const TABLE_FORMAT = 'plan-status-table v1';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const MODULES_DIR = join(ROOT, 'project-memory', 'modules');
const OUTPUT = join(ROOT, 'project-memory', 'project-memory-status.md');

const HEADER = /^> \*\*Status:\*\*\s*(.+?)\s*$/;
const DETAIL = /\*\*Detail:\*\*\s*(.+?)\s*(?: · |$)/;
const UPDATED = /\*\*Updated:\*\*\s*(\S+)/;

function normalize(p) {
  return p.split(BACKSLASH).join('/');
}

function listDirs(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    .map((e) => e.name)
    .sort();
}

function listPlans(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && /\.md$/i.test(e.name) && !e.name.startsWith('_'))
    .map((e) => e.name)
    .sort();
}

function readHeader(file) {
  const lines = readFileSync(file, 'utf8').split(/\r?\n/).slice(0, 10);
  for (const line of lines) {
    const m = HEADER.exec(line);
    if (!m) continue;
    const parts = m[1].split(' · ');
    const status = parts[0].trim();
    const detail = DETAIL.exec(m[1]);
    const updated = UPDATED.exec(m[1]);
    return { status, detail: detail ? detail[1] : '', updated: updated ? updated[1] : '' };
  }
  return null;
}

function cell(text) {
  return String(text).split('|').join(BACKSLASH + '|');
}

function collect() {
  const plans = [];
  for (const name of listDirs(MODULES_DIR)) {
    const plansDir = join(MODULES_DIR, name, 'plans');
    for (const file of listPlans(plansDir)) {
      const header = readHeader(join(plansDir, file));
      plans.push({
        module: name,
        file,
        link: `modules/${name}/plans/${file}`,
        status: header ? header.status : '⚠ no status header',
        detail: header ? header.detail : '',
        updated: header ? header.updated : '',
        done: header ? header.status === 'Done' : false,
      });
    }
  }
  return plans;
}

function livePlans(plans) {
  return plans
    .filter((p) => !p.done)
    .sort((a, b) => (a.updated || '0').localeCompare(b.updated || '0'));
}

// linkBase prefixes each plan link: '' inside the project, a file:/// URL in the vault copy.
function render(plans, linkBase = '') {
  const live = livePlans(plans);

  const out = [
    '# Project memory status',
    '',
    '> Generated by `.claude/hooks/project-memory-status.mjs` from each module plan\'s',
    '> `> **Status:**` header — do not edit by hand. Lists every plan not `Done`; the plans are',
    '> the source of truth. Rebuilt on every Claude write to a plan; after editing a plan by hand,',
    '> run `node .claude/hooks/project-memory-status.mjs --regenerate`.',
    '',
    `## Live work — ${live.length} plan(s) not Done`,
    '',
    `<!-- ${TABLE_FORMAT} -->`,
    '',
  ];

  if (live.length === 0) {
    out.push('Nothing live. Every plan is `Done`, or no module has a plan yet.');
  } else {
    out.push('Oldest first — the most-forgotten plan floats to the top.', '');
    out.push('| Module | Plan | Status | Detail | Updated |', '|---|---|---|---|---|');
    for (const p of live) {
      out.push(`| ${cell(p.module)} | [${cell(p.file)}](${linkBase}${p.link}) | ${cell(p.status)} | ${cell(p.detail)} | ${p.updated} |`);
    }
  }

  out.push('');
  return out.join('\n');
}

function writeIfChanged(file, content) {
  const current = existsSync(file) ? readFileSync(file, 'utf8') : null;
  if (current !== content) writeFileSync(file, content, 'utf8');
}

function regenerate() {
  const plans = collect();
  writeIfChanged(OUTPUT, render(plans));
  mirrorToVault(plans);
}

// ---------- optional cross-project mirror (Obsidian vault or any plain folder) ----------

// Opt-in per machine: first config found wins. No config → no-op, so a teammate without a
// vault never notices this exists.
const VAULT_CONFIGS = [
  join(ROOT, '.claude', 'skills', 'wp-obsidian-progress-log', 'references', 'vault-path.local.json'),
  join(homedir(), '.claude', 'progress-vault.json'),
];
const PROJECT = basename(ROOT);
const NOTE_NAME = '_plans.md';
const MARKER = `<!-- ${TABLE_FORMAT} -->`;

function vaultPath() {
  for (const file of VAULT_CONFIGS) {
    if (!existsSync(file)) continue;
    const path = JSON.parse(readFileSync(file, 'utf8')).vaultPath;
    if (path && !path.includes('<')) return path; // skip the example placeholder
  }
  return null;
}

function mirrorToVault(plans) {
  const vault = vaultPath();
  if (!vault || !existsSync(vault)) return;
  const board = join(vault, 'Project Progress');
  const live = livePlans(plans);
  const dir = normalize(join(ROOT, 'project-memory'));
  const linkBase = 'file://' + (dir.startsWith('/') ? '' : '/') + encodeURI(dir) + '/';

  // Same render() as the in-project file — one table format to maintain — plus frontmatter.
  const note = [
    '---',
    'type: plan-status',
    `project: ${PROJECT}`,
    `live_plans: ${live.length}`,
    `oldest_update: ${live.length ? live[0].updated || '-' : ''}`,
    `path: "${normalize(ROOT)}"`,
    '---',
    '',
    render(plans, linkBase),
  ].join('\n');
  mkdirSync(join(board, PROJECT), { recursive: true });
  writeIfChanged(join(board, PROJECT, NOTE_NAME), note);
  rebuildBoardIndex(board);
}

// The board copies each project's table block verbatim (from the TABLE_FORMAT marker down),
// so it never has its own format. Projects are ordered by their oldest live plan.
// ponytail: full rebuild from every project's note, last writer wins. Two projects writing in
// the same instant can drop one's newest rows until its next plan write; add a lock if that bites.
function rebuildBoardIndex(board) {
  const live = [];
  const clear = [];
  for (const project of listDirs(board)) {
    const file = join(board, project, NOTE_NAME);
    if (!existsSync(file)) continue;
    const text = readFileSync(file, 'utf8');
    const count = Number((/^live_plans: (\d+)$/m.exec(text) || [])[1] || 0);
    if (count === 0) {
      clear.push(project);
      continue;
    }
    const lines = text.split(/\r?\n/);
    const start = lines.indexOf(MARKER);
    if (start < 0) continue; // a note from an older table format: skip until that project regenerates
    live.push({
      project,
      count,
      oldest: (/^oldest_update: (.*)$/m.exec(text) || [])[1] || '',
      block: lines.slice(start).join('\n').trim(),
    });
  }
  const key = (o) => (o === '-' ? '0' : o); // '-' = an undated plan, the most forgotten
  live.sort((a, b) => key(a.oldest).localeCompare(key(b.oldest)));

  const out = [
    '# Live plans — all projects',
    '',
    '> Generated by each project\'s `project-memory-status.mjs` hook — do not edit. Each table is',
    '> that project\'s `project-memory-status.md` table; the project with the oldest plan comes first.',
    '',
  ];
  for (const p of live) out.push(`## ${p.project} — ${p.count} plan(s) not Done`, '', p.block, '');
  if (live.length === 0) out.push('Nothing live in any project.', '');
  out.push('## Clear — nothing live', '', clear.length ? clear.join(' · ') : '—', '');
  writeIfChanged(join(board, '_Live plans.md'), out.join('\n'));
}

// ---------- hook mode (PostToolUse, stdin) ----------

function touchesPlans(payload) {
  const tool = String(payload.tool_name || '');
  const ti = payload.tool_input || {};
  if (tool === 'Bash' || tool === 'PowerShell') {
    const cmd = normalize(String(ti.command || ''));
    return /project-memory\/modules|\/plans\//i.test(cmd);
  }
  const path = normalize(String(ti.file_path || ''));
  return /(^|\/)project-memory\/modules\/[^/]+\/plans\/[^/]+\.md$/i.test(path);
}

function hook() {
  let raw = '';
  try {
    raw = readFileSync(0, 'utf8');
  } catch {
    return;
  }
  if (!raw.trim()) return;
  if (touchesPlans(JSON.parse(raw))) regenerate();
}

// ---------- entry ----------

try {
  if (process.argv.includes('--regenerate')) regenerate();
  else hook();
} catch (err) {
  // Fail open, but say so - a silently stale view is worse than a loud one.
  console.error(`project-memory-status.mjs failed, status view not rebuilt: ${err && err.message}`);
}
process.exit(0);
