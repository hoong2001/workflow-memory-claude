#!/usr/bin/env node
/**
 * SessionStart: tell the user when the master template has a newer version than this project.
 *
 * Reads the local SYNC-MANIFEST.md (its `| Version |` row and the Master source `| Repo |` and
 * `| Branch |` rows), fetches the master's SYNC-MANIFEST.md from the same repo, and compares the
 * two versions. Newer master → one line shown to the user and handed to Claude, naming both
 * versions and /wp-update-from-master. Same or older → silent.
 *
 * Only GitHub repos are checked (the raw file URL is derived from the repo URL); any other host
 * is skipped silently. No caching: one small HTTP request per session start, capped by TIMEOUT_MS.
 *
 * Runtime: Node.js 18+ (global fetch).
 *
 * Fails OPEN: offline, a timeout, a missing manifest, any error → exit 0 with no output.
 * A version check must never delay or block a session.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const MANIFEST = join(ROOT, 'SYNC-MANIFEST.md');
const TIMEOUT_MS = 4000;

function row(text, name) {
  const m = new RegExp('^\\|\\s*' + name + '\\s*\\|\\s*`([^`]+)`', 'm').exec(text);
  return m ? m[1] : null;
}

function rawUrl(repo, branch) {
  const m = /^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/.exec(repo);
  return m ? `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${branch}/SYNC-MANIFEST.md` : null;
}

// a > b for MAJOR.MINOR.PATCH
function isNewer(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0);
  }
  return false;
}

async function main() {
  if (!existsSync(MANIFEST)) return;
  const local = readFileSync(MANIFEST, 'utf8');
  const current = row(local, 'Version');
  const url = rawUrl(row(local, 'Repo') || '', row(local, 'Branch') || 'main');
  if (!current || !url) return;

  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) return;
  const latest = row(await res.text(), 'Version');
  if (!latest || !isNewer(latest, current)) return;

  const msg = `Workflow template update available: ${current} → ${latest}. Run /wp-update-from-master to sync.`;
  process.stdout.write(JSON.stringify({
    systemMessage: msg,
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: msg },
  }));
}

// No process.exit(): on Windows, Node 24 asserts in libuv when exit runs while fetch's socket is
// still closing. Let the event loop drain instead.
main().catch(() => {});
