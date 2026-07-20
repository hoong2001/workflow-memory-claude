---
name: workspace-auto-test-loop
description: Automated build-and-test loop for the ASP.NET MVC solution - compile via vswhere-located MSBuild, auto-fix compile errors and rebuild until green, verify data with CRUD-only SQL (connection read from Web.config), and web-test the changed flow against a site the USER has started. Invoke ONLY on the user's explicit request ("run auto test", "build and test this", "自動測試") - never auto-trigger after coding. Do NOT use for DDL/schema changes, deployments, starting/stopping the site, or running unit-test frameworks.
---

# Auto Test Loop — build → fix → verify → web-test

Run the full loop after a coding change, on the user's explicit invocation only.
Invocation = authorization for THIS run; it expires when the loop ends.

**Hard guardrails (non-negotiable):**
- SQL is CRUD-only (SELECT / INSERT / UPDATE / DELETE). `scripts/run-sql.ps1` enforces the
  whitelist — never bypass it by running SQL another way (sqlcmd, ad-hoc .NET, etc.).
- Never start, stop, or restart the site / IIS / IIS Express — the user owns the site lifecycle.
- Never edit Web.config to "fix" a connection problem — report and ask.
- Never commit; report results and stop.

## Step 0 · Scope the run

1. Identify WHAT to verify: the current plan's Definition of Done
   (`.claude/modules/<name>/plans/…`), or ask the user for the acceptance behavior in one line.
2. Locate the `.sln` (glob the repo root). Multiple solutions → ask which.
3. If a web test is needed, confirm the site is running and get its base URL
   (offer the last-known URL as the default).

## Step 1 · Build

```powershell
scripts/build-solution.ps1 -SolutionPath <path\to\Solution.sln>
```

- Exit 0 = green → go to Step 3. Exit 1 = compile errors → Step 2. Exit 2 = environment
  problem (no vswhere/MSBuild) → report and stop; do not guess paths.
- Missing NuGet packages (`packages.config` projects don't auto-restore): run
  `nuget restore <sln>` if `nuget.exe` is available, otherwise ask the user to restore in VS.

## Step 2 · Auto-fix loop (max 5 rounds)

1. Parse error lines: `path\file.cs(line,col): error CSxxxx: message`. Fix the FIRST errors
   first — later ones are often cascades.
2. Common causes in this stack: C# syntax newer than 7.3 (no `switch` expressions, ranges,
   `??=`, target-typed `new`), async/await or DI creeping in (both forbidden), missing
   Result-class property, wrong Base-class inheritance.
3. Fixes must respect the architecture doc (`.claude/workspace-project-stack-architecture.md`)
   — never "fix" an error by violating a hard rule (e.g. adding an interface or async).
4. Rebuild after each round. **Stop conditions:** same error signature two rounds in a row,
   or 5 rounds reached → stop, summarize what was tried, hand back to the user.

## Step 3 · Data verification (CRUD-only SQL)

```powershell
scripts/run-sql.ps1 -WebConfigPath <Web\Web.config> -ConnectionName <name> -Query "<sql>"
```

- Connection comes from the Web project's Web.config `<connectionStrings>`; multiple entries →
  the script lists names, pick with `-ConnectionName` (ask the user if unclear).
- Seed → act → verify → clean up. Tag seeded rows with an obvious marker value
  (e.g. `'AUTOTEST-<date>'` in a text column) and delete ONLY tagged rows afterward.
- **Persist every test SQL script** to the target module's `schema/test/` folder
  (create it if missing): `.claude/modules/<name>/schema/test/<name>-<date>-<slug>.sql`,
  same date+slug as the plan being verified. One file per run holding the seed / verify /
  cleanup statements in order, separated by comment headers (`-- SEED`, `-- VERIFY`,
  `-- CLEANUP`) — so the same check is re-runnable next time instead of being rewritten.
  Reuse an existing script when re-testing the same plan; don't create duplicates.
- UPDATE/DELETE without WHERE is rejected by the script; `-AllowNoWhere` exists but should
  effectively never be used against a shared dev database.
- Rejected query (exit 3) = the query is out of scope for this skill — redesign the check,
  don't work around the whitelist.

## Step 4 · Web test (user-started site)

1. Preconditions: site already running (Step 0), base URL known. Site unreachable → report
   and wait; never try to start it.
2. Tool order: **Playwright MCP first** (deterministic, headless-friendly); fall back to
   Claude-in-Chrome if Playwright is unavailable or the user prefers watching their browser.
   Load the tools via ToolSearch in ONE call.
3. Drive the changed flow end-to-end per the Definition of Done: navigate → act (fill/click)
   → assert visible outcome. Check the browser console for JS errors and failed network
   requests as part of every pass.
4. Cross-check UI actions against the database with Step 3 (e.g. after a Save flow, SELECT
   the row and compare values).

## Step 5 · Report

Summarize in one block: build rounds + what was fixed, SQL checks run and results, web-test
pass/fail per acceptance point, anything left for the user. Then remind in one line that
`/workspace-module-save-implementation` is ready to run — never auto-run it.
