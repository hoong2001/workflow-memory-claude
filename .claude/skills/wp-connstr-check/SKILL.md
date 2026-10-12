---
name: wp-connstr-check
description: Sweep every Web.config / App.config (and their web.*.config / app.*.config transforms) under the project for MSSQL connectionStrings that depart from the house template, show the corrections as a dry run, and apply them only on the user's go. Use when the user says "check connection strings", "fix connectionString", "檢查連線字串", "統一 connectionString", when adopting this workflow template on an existing .NET project, or after config files were edited outside Claude (Visual Studio, sed, a merge). Do NOT use as the routine guard, which is the always-on PostToolUse hook .claude/hooks/connstr-check.mjs, and do NOT use for non-MSSQL providers or Entity Framework metadata strings - the script skips them by design.
---

# Connection-String Check — sweep what the hook never saw

The `PostToolUse` hook checks one config file at the moment Claude writes it with Write / Edit /
MultiEdit. This skill covers the rest: config files that already existed, files edited in
Visual Studio, and files changed through Bash or PowerShell, which the hook's matcher does not see.

The template and the rules live in ONE place — `.claude/hooks/connstr-check.mjs`. This skill runs
that script's `--fix` mode instead of carrying its own copy, so the sweep and the hook cannot
disagree.

## Procedure

### 1 · Dry run

```bash
node .claude/hooks/connstr-check.mjs --fix .
```

Pass a sub-folder instead of `.` when the user names one. Without `--write` nothing is changed.

Each line of output is one of:

| Prefix | Meaning | Action |
|---|---|---|
| `DIFF` + `WOULD FIX` | The string departs from the template; `-` is the current value, `+` the corrected one | Goes into the fix list |
| `WARN` | Keys the template drops (`將捨棄: ...`) | Show the user — a dropped key may carry meaning |
| `MANUAL` | `Data Source` / `Initial Catalog` / `User ID` / `Password` missing, typically `Integrated Security=True` | Never auto-fixed; the user decides |
| `SKIP` | Not UTF-8 / UTF-16, or no `.csproj` above the file | Name the file and the reason |

No output at all ends the skill: every MSSQL connectionString already matches. Say so in one line
and stop.

Ignore hits under `bin\` or `obj\` — those are build outputs (e.g. `obj\...\TransformWebConfig\`)
that the next build regenerates from the source config. List them separately so the user sees
they were skipped on purpose.

### 2 · Report the dry run — values masked

The `-` / `+` lines carry live passwords. Never repeat them in the reply: rewrite every
`Password=` value as `Password=<PASSWORD>` (and `User ID=` as `<DB_USER>` if the user prefers)
before showing the diff. Report per file: which `<add name="...">` entry changes, and which keys
are added, renamed or dropped.

### 3 · Apply on the user's go

Applying rewrites config files, so ask through `AskUserQuestion`: apply all `WOULD FIX` files /
apply none. On yes:

```bash
node .claude/hooks/connstr-check.mjs --fix . --write
```

The script keeps each file's encoding and BOM and touches only the attribute value, so the rest of
the file stays byte-identical.

### 4 · Confirm

Re-run the dry run from step 1. Only `MANUAL` / `SKIP` / `bin\`-`obj\` lines may remain.

## Handoff

The masked diff report is Done. `MANUAL` entries left → open: the You now is fixing those entries
by hand, the Next is re-running this skill. Everything applied or already clean →
`🏁 Closed — nothing pending.`

## Boundaries

- Scope is MSSQL `connectionString` attributes in `web.config` / `app.config` and their
  transforms — exactly the hook's scope.
- The skill never writes without the user's go, never edits a `MANUAL` entry, and never prints a
  real password.
- Trigger is the user's. Never auto-run this sweep after ordinary work.
