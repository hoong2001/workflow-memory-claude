---
name: wp-secret-scan
description: Sweep memory/workflow docs for leaked credentials; redact, flag rotations.
disable-model-invocation: true
---

# Secret Scan — audit what the hook could not catch

The `PreToolUse` hook stops a credential on its way in. This skill audits the ones already on
disk: written before the hook existed, synced in from another machine, or pasted by hand.
Patterns and scope: `.claude/hooks/block-secrets.mjs` (header, `isGuarded`) — this skill runs
that script in audit mode.

## Procedure

### 1 · Run the sweep

```bash
node .claude/hooks/block-secrets.mjs .
```

Hits print masked; open a file at the reported line only to triage that hit.

Zero hits ends the skill. Say so in one line and stop.

### 2 · Triage each hit — real credential, or false positive?

Open the file at the reported line and decide:

| Verdict | What it looks like | Action |
|---|---|---|
| Real credential | A value that would actually authenticate somewhere | Rotation check (step 3), then redact (step 4) |
| Sample or fixture | An obviously fake value in an example | Rewrite as a placeholder anyway (step 4), so the next sweep stays quiet |
| Pattern false positive | The key word appears but the value is prose, a column name, a hash algorithm | Leave it; note it in the report |

Never paste a real value into the chat while triaging. Name the file and line instead.

### 3 · Decide what needs rotating — before redacting

An edit removes the value from the working tree, not from history. For each real credential,
before step 4 redacts it:

```bash
git blame --porcelain -L <line>,<line> -- <path>
```

A first-line hash of all zeros = never committed. Any other hash = the value is published in
history: tell the user plainly **the credential must be rotated**, because rewriting git history
on a synced, shared repo is worse than the leak for most projects. Do not attempt the rewrite
yourself. The command names no value, so the PreToolUse hook — it scans every shell command that
names `project-memory/`, `.claude/` or a `.md` — lets it through.

### 4 · Redact

Replace the value with a placeholder and add where the real one lives:

```
Password=<PASSWORD>   (real value: Web.config of the Web project on the deployment server)
```

Edit with `old_string` carrying the secret and `new_string` carrying the placeholder — the hook
never scans `old_string`, so this always goes through.

### 5 · Report

One short table: file:line, verdict, action taken, and — separately and prominently — the list
that needs rotating. Then re-run step 1 yourself: done when every remaining hit is a pattern false
positive named in the table. In handoff terms (the **Handoff** section of
`.claude/skills/_shared-conventions.md`): the table and the re-run are Done, rotating the listed
credentials is You now. Nothing to rotate → closed: `└─ 🏁 Closed  nothing pending`
