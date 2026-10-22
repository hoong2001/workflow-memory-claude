---
name: wp-connstr-check
description: Check Web/App.config MSSQL connection strings against the house template (dry run first).
disable-model-invocation: true
---

# Connection-String Check — sweep what the hook never saw

The `PostToolUse` hook checks one config file at the moment Claude writes it with Write / Edit /
MultiEdit. This skill sweeps the rest: config files that already existed, files edited in
Visual Studio, and files changed through Bash or PowerShell. Template and rules:
`.claude/hooks/connstr-check.mjs` (header); this skill drives its `--fix` mode.

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
| `WARN` | Keys the template drops (`will drop: ...`) | Show the user — a dropped key may carry meaning |
| `MANUAL` | `Data Source` / `Initial Catalog` / `User ID` / `Password` missing, typically `Integrated Security=True` | Never auto-fixed; the user decides |
| `SKIP` | Not UTF-8 / UTF-16, or no `.csproj` above the file | Name the file and the reason |

No output at all ends the skill: every MSSQL connectionString already matches. Say so in one line
and stop.

Hits under `bin\` or `obj\` are build outputs (e.g. `obj\...\TransformWebConfig\`) that the next
build regenerates from the source config. Report them on a separate line. `--write` rewrites them
along with the sources, which is harmless.

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

### 4 · Confirm

Re-run the dry run from step 1. Only `MANUAL` / `SKIP` lines may remain.

## Handoff

The masked diff report is Done. `MANUAL` entries left → open: the You now is fixing those entries
by hand, the Next is re-running this skill. Everything applied or already clean →
`└─ 🏁 Closed  nothing pending`
