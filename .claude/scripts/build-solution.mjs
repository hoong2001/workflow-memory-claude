#!/usr/bin/env node
/**
 * build-solution.mjs — compile the project's .sln with the MSBuild found on PATH.
 *
 * Claude runs this after each coding chunk (`.claude/rules/workspace-workflow.md` Step 2):
 *   node .claude/scripts/build-solution.mjs                  # the one .sln at the project root
 *   node .claude/scripts/build-solution.mjs <path.sln> [Configuration]
 *
 * Exit codes: 0 = build green · 1 = errors or a failed step (compile lines read `file.cs(line,col): error CSxxxx`)
 *             2 = environment problem (no .sln, msbuild not on PATH) —
 *                 the build falls back to the user. *
 * Node rather than PowerShell so the same file runs from any shell; MSBuild itself is still
 * Windows-only, which the exit-2 path reports instead of failing obscurely.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const [slnArg, configuration = 'Debug'] = process.argv.slice(2);

function envError(message) {
  console.log(`ERROR: ${message}`);
  process.exit(2);
}

let solution = slnArg && resolve(slnArg);
if (!solution) {
  const found = readdirSync(ROOT).filter((name) => name.toLowerCase().endsWith('.sln'));
  if (found.length === 0) envError('no .sln at the project root; pass its path as the first argument.');
  if (found.length > 1) envError(`several .sln at the project root, pass one: ${found.join(', ')}`);
  solution = join(ROOT, found[0]);
}
if (!existsSync(solution)) envError(`solution not found: ${solution}`);

// MSBuild comes from PATH — the machine owner decides which one (VS2017's MSBuild 15 for this stack).
const probe = spawnSync('msbuild', ['-version', '-nologo'], { encoding: 'utf8' });
if (probe.error) envError('msbuild is not on PATH. Add the folder holding VS2017\'s MSBuild.exe '
  + '(…\\MSBuild\\15.0\\Bin) to PATH, then open a fresh terminal.');
const msbuildVersion = probe.stdout.trim().split(/\r?\n/).pop();

// Console only, no log files: Claude reads this output and reports what needs attention.
// minimal = errors + warnings + one line per built project; Summary = the counts at the end.
console.log(`MSBuild : ${msbuildVersion} (from PATH)\nSolution: ${solution}\nConfig  : ${configuration}\n${'-'.repeat(40)}`);
const run = spawnSync('msbuild', [solution, '/nologo', '/m', '/v:minimal', '/clp:Summary',
  `/p:Configuration=${configuration}`], { stdio: 'inherit' });
if (run.error) envError(`could not start MSBuild: ${run.error.message}`);

console.log('-'.repeat(40));
if (run.status === 0) {
  console.log('BUILD SUCCEEDED');
  process.exit(0);
}
console.log(`BUILD FAILED (msbuild exit ${run.status}) — error lines above read: path\\file.cs(line,col): error CSxxxx: message`);
process.exit(1);
