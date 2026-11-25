---
name: wp-nlog-check
description: Check every NLog.config against the house template (dry run first).
disable-model-invocation: true
---

# NLog.config Check — sweep what the hook never saw

The `PostToolUse` hook checks one `NLog.config` at the moment Claude writes it with Write / Edit /
MultiEdit. This skill sweeps the rest: files that already existed, files edited in Visual Studio,
and files changed through Bash or PowerShell. Template and rules: `.claude/hooks/nlog-check.mjs`
(header) and `.claude/hooks/nlog-template.config`; this skill drives the script's `--fix` mode.

A file matches when it equals the template except the six per-project variable values
(`logName`, `appName`, `smtpServer`, `mailFrom`, `mailTo`, `mailSubject`). Those values stay as the
project has them.

## Procedure

### 1 · Dry run

```bash
node .claude/hooks/nlog-check.mjs --fix .
```

Pass a sub-folder instead of `.` when the user names one. Without `--write` nothing is changed.
Files under `bin\`, `obj\`, `packages\` are skipped.

Each line of output is one of:

| Prefix | Meaning | Action |
|---|---|---|
| `WOULD FIX` | The file differs from the template outside the six values | Goes into the fix list |
| `MANUAL` | One of the six variables is missing or empty, so there is no value to carry over | Never auto-fixed; the user supplies the value |

No output at all ends the skill: every `NLog.config` already matches. Say so in one line and stop.

### 2 · Show what would change

The output names files only. For each `WOULD FIX` file, find the first differing line:

```bash
echo '{"tool_input":{"file_path":"<ABSOLUTE_PATH_TO_NLog.config>"}}' | node .claude/hooks/nlog-check.mjs
```

It prints `line N differs` with the current (`-`) and template (`+`) line. A target the project
removed on purpose (for example the `mail` target) shows up here: name it to the user, because
`--write` puts it back.

### 3 · Apply on the user's go

Applying rewrites config files, so ask through `AskUserQuestion`: apply all `WOULD FIX` files /
apply none. On yes:

```bash
node .claude/hooks/nlog-check.mjs --fix . --write
```

### 4 · Confirm

Re-run the dry run from step 1. Only `MANUAL` lines may remain.

## Handoff

The per-file report is Done. `MANUAL` entries left → open: the You now is filling in the missing
variables by hand, the Next is re-running this skill. Everything applied or already clean →
`└─ 🏁 Closed  nothing pending`
