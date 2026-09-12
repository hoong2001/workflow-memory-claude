---
name: wp-secret-scan
description: Sweep this project's memory and workflow files (project-memory/, .claude/, and every .md) for credentials that were written before the no-secrets hook existed or that slipped past it, then redact the hits and say which ones need rotating. Use when the user says "scan for secrets", "check for leaked passwords", "掃描密碼", "有冇洩漏 API key", when adopting this workflow template on an existing project, or before making a repository public. Do NOT use to scan application source or config (Web.config, appsettings.json, .env) - a connection string legitimately lives there; and do NOT use it as the routine guard, which is the always-on PreToolUse hook described in .claude/rules/workspace-no-secrets.md.
---

# Secret Scan — audit what the hook could not catch

The `PreToolUse` hook stops a credential on its way in. This skill deals with the ones already
on disk: written before the hook existed, synced in from another machine, or pasted by hand.

Detection patterns live in ONE place — `.claude/hooks/block-secrets.mjs`. This skill runs that
same script in audit mode rather than carrying its own copy, so the sweep and the live guard
can never disagree.

## Procedure

### 1 · Run the sweep

```bash
node .claude/hooks/block-secrets.mjs project-memory .claude CLAUDE.md README.md
```

Runs the same on Windows, WSL, macOS and Linux — the guard is Node, not PowerShell, so the
sweep needs no per-platform variant.

Output is one line per hit — `path:line: <key> = <masked value>` — and a count. The value is
masked on purpose; read the file to see the real one only when triaging that specific hit.

Zero hits ends the skill. Say so in one line and stop.

### 2 · Triage each hit — real credential, or false positive?

Open the file at the reported line and decide:

| Verdict | What it looks like | Action |
|---|---|---|
| Real credential | A value that would actually authenticate somewhere | Redact (step 3) + rotate (step 4) |
| Sample or fixture | An obviously fake value in an example | Rewrite as a placeholder anyway, so the next sweep stays quiet |
| Pattern false positive | The key word appears but the value is prose, a column name, a hash algorithm | Leave it; note it in the report |

Never paste a real value into the chat while triaging. Name the file and line instead.

### 3 · Redact

Replace the value with a placeholder and add where the real one lives:

```
Password=<PASSWORD>   (real value: Web.config of the Web project on the deployment server)
```

Edit with `old_string` carrying the secret and `new_string` carrying the placeholder — the hook
never scans `old_string`, so this always goes through.

### 4 · Decide what needs rotating

An edit removes the value from the working tree, not from history. For each real credential:

```bash
git log --oneline -S "<the secret>" -- <path>
```

Any commit returned means the value is published in history. Tell the user plainly: **the
credential must be rotated**, because rewriting git history on a synced, shared repo is worse
than the leak for most projects. Do not attempt the rewrite yourself.

### 5 · Report

One short table: file:line, verdict, action taken, and — separately and prominently — the list
that needs rotating. End with the re-run command so the user can confirm the sweep is clean.

## Boundaries

- Scope is the memory and workflow layer only, exactly matching the hook. Application source
  and config are out of scope by design.
- The skill never rotates a credential, never edits git history, and never prints a real
  secret value.
- Trigger is the user's. Never auto-run this sweep after ordinary work.
