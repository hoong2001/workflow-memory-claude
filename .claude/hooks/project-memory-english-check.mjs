#!/usr/bin/env node
/**
 * PreToolUse guard: documents under project-memory/ are written in English
 * (.claude/rules/workspace-doc-writing-style.md → Language).
 *
 * Denies a Write / Edit / MultiEdit to a project-memory .md file when the INCOMING text holds
 * more Han (CJK) characters than the text it replaces, so an edit that removes Chinese, or
 * touches a line that already carries it, still passes. A user's words are quoted as an
 * English paraphrase, never verbatim.
 *
 * Scope: project-memory/**\/*.md, except folders that hold material written outside the
 * workflow: references/ (user-supplied documents) and tasks/ (one-off task records).
 *
 * Runtime: Node.js, one implementation on every OS. Fails OPEN: any error allows the write.
 *
 *   node project-memory-english-check.mjs --selftest
 */

import { existsSync, readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const BACKSLASH = String.fromCharCode(92);
const HAN = /\p{Script=Han}/gu;

function normalize(p) {
  return p.split(BACKSLASH).join('/');
}

function isGuarded(path) {
  const p = normalize(path || '');
  if (!/(^|\/)project-memory\/.+\.md$/i.test(p)) return false;
  if (/(^|\/)project-memory\/(.+\/)?(references|tasks)\//i.test(p)) return false;
  return true;
}

function countHan(text) {
  return (String(text || '').match(HAN) || []).length;
}

// Each pair is { before, after }: the text a write removes and the text it puts in.
function pairsOf(tool, ti) {
  if (tool === 'Write') {
    const path = String(ti.file_path || '');
    const before = existsSync(path) ? readFileSync(path, 'utf8') : '';
    return [{ before, after: String(ti.content || '') }];
  }
  if (tool === 'MultiEdit' && Array.isArray(ti.edits)) {
    return ti.edits.map((e) => ({ before: String((e && e.old_string) || ''), after: String((e && e.new_string) || '') }));
  }
  return [{ before: String(ti.old_string || ''), after: String(ti.new_string || '') }];
}

function violates(tool, ti) {
  if (!isGuarded(String(ti.file_path || ''))) return false;
  return pairsOf(tool, ti).some((pair) => countHan(pair.after) > countHan(pair.before));
}

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
  if (!ti || !['Write', 'Edit', 'MultiEdit'].includes(tool)) return;
  if (!violates(tool, ti)) return;

  const reason = [
    `Blocked: this write puts Chinese characters into ${ti.file_path}.`,
    'Documents under project-memory/ are written in English (.claude/rules/workspace-doc-writing-style.md).',
    "Write the text in English; paraphrase a user's words instead of quoting them verbatim.",
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

function selftest() {
  const plan = '/x/project-memory/modules/m/plans/p.md';
  assert.equal(violates('Write', { file_path: plan, content: '# Plan\n決策' }), true);
  assert.equal(violates('Write', { file_path: plan, content: '# Plan\nDecision' }), false);
  assert.equal(violates('Edit', { file_path: plan, old_string: 'a', new_string: 'a 中文' }), true);
  assert.equal(violates('Edit', { file_path: plan, old_string: '中文 a', new_string: '中文 b' }), false);
  assert.equal(violates('Edit', { file_path: plan, old_string: '中文', new_string: 'English' }), false);
  assert.equal(violates('MultiEdit', { file_path: plan, edits: [{ old_string: 'a', new_string: 'b' }, { old_string: 'c', new_string: '中' }] }), true);
  assert.equal(violates('Write', { file_path: '/x/project-memory/modules/m/references/spec.md', content: '需求' }), false);
  assert.equal(violates('Write', { file_path: '/x/project-memory/tasks/t/TASK.md', content: '需求' }), false);
  assert.equal(violates('Write', { file_path: '/x/ReportHelper.cs', content: '中文' }), false);
  assert.equal(violates('Write', { file_path: 'C:' + BACKSLASH + 'x' + BACKSLASH + 'project-memory' + BACKSLASH + 'a.md', content: '中文' }), true);
  console.log('selftest ok');
}

try {
  if (process.argv.includes('--selftest')) selftest();
  else hook();
} catch (err) {
  // Fail open, but say so - a silent guard is worse than no guard.
  console.error(`project-memory-english-check.mjs failed, write allowed: ${err && err.message}`);
}
process.exit(0);
