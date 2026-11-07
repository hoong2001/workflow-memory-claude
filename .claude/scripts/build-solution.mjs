#!/usr/bin/env node
/**
 * build-solution.mjs — Rebuild (clean + build) the project's .sln with the MSBuild found on PATH.
 *
 * Claude runs this after each coding chunk (`.claude/rules/workspace-build-loop.md`):
 *   node .claude/scripts/build-solution.mjs                  # the one .sln at the project root
 *   node .claude/scripts/build-solution.mjs <path.sln> [Configuration] [Platform]
 *   node .claude/scripts/build-solution.mjs <path.csproj|path.vbproj> [Configuration] [Platform]
 *
 * A project file rebuilds that project and the projects it references only — for when another
 * project in the solution fails on code this task never touched, or one project needs its own
 * Configuration|Platform (e.g. Release x86). Platform is passed as given ("Any CPU" for a .sln,
 * "AnyCPU" or "x86" for a project file).
 *
 * Exit codes: 0 = build green · 1 = errors or a failed step (compile lines read `file.cs(line,col): error CSxxxx`)
 *             2 = environment problem (no .sln, msbuild not on PATH) —
 *                 the build falls back to the user.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const [slnArg, configuration = 'Debug', platform] = process.argv.slice(2);

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
if (!/\.(sln|csproj|vbproj)$/i.test(solution)) envError(`not a .sln, .csproj or .vbproj: ${solution}`);
if (!existsSync(solution)) envError(`solution not found: ${solution}`);

// MSBuild comes from PATH — the machine owner decides which one (VS2017's MSBuild 15 for this stack).
const probe = spawnSync('msbuild', ['-version', '-nologo'], { encoding: 'utf8' });
if (probe.error) envError('msbuild is not on PATH. Add the folder holding VS2017\'s MSBuild.exe '
  + '(…\\MSBuild\\15.0\\Bin) to PATH, then open a fresh terminal.');
const msbuildVersion = probe.stdout.trim().split(/\r?\n/).pop();

// Console only, no log files: Claude reads this output and reports what needs attention.
// minimal = errors + warnings + one line per built project; Summary = the counts at the end.
console.log(`MSBuild : ${msbuildVersion} (from PATH)\nTarget  : ${solution}\nConfig  : ${configuration}${platform ? ' | ' + platform : ''}\n${'-'.repeat(40)}`);
// Always Rebuild (clean + build): an incremental build can pass on stale outputs under bin\/obj\.
const msbuildArgs = [solution, '/t:Rebuild', '/nologo', '/m', '/v:minimal', '/clp:Summary',
  `/p:Configuration=${configuration}`];
if (platform) msbuildArgs.push(`/p:Platform=${platform}`);
const run = spawnSync('msbuild', msbuildArgs, { stdio: 'inherit' });
if (run.error) envError(`could not start MSBuild: ${run.error.message}`);

console.log('-'.repeat(40));
if (run.status === 0) {
  console.log('BUILD SUCCEEDED');
  process.exit(0);
}
console.log(`BUILD FAILED (msbuild exit ${run.status}) — error lines above read: path\\file.cs(line,col): error CSxxxx: message`);
process.exit(1);
