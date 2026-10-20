---
name: wp-retro
description: Retrospective on one session's friction — traces each struggle to a moment in the record and proposes the check, pointer, or rule in the workflow (rules, skills, hooks, build script, module memory) that stops it recurring; the user picks what lands. Use when the user says "retro", "回顧", "檢討今次 session", or after the wrap-up reminder names a friction signal. Code review and recording what was built belong to other skills.
---

# Retro — fix the environment the friction came from

Load `wp-writing-for-agents` first: every steering change proposed here is written to it.

## Step 1 · Pick the session

Default to the current session. If the user names another, read its log under
`~/.claude/projects/<project-slug>/<session-id>.jsonl`. Also read what that session wrote: the
paired impl record or `TASK.md`, and any `Known gotchas` line it added to a `MODULE.md`.

A session that has scrolled out of context → ask the user to start a fresh session and point
`/wp-retro` at the old log, rather than reconstructing it from memory.

## Step 2 · Collect friction, with evidence

Start from the friction signals in `.claude/rules/workspace-update-memory.md` item 7, then any
other moment the session struggled. Each moment carries its evidence — the tool call, the error
text, or the user's own words, quoted. **No evidence, no candidate.**

No friction found → say so in one line and close.

## Step 3 · Classify each moment and pick its destination

| Category | What went wrong | Destination |
|---|---|---|
| Navigation | Finding a file or fact took too long | A pointer in a file the agent already reads: the module's `MODULE.md` / `<name>-flow.md`, a Common Entry Points line in `CLAUDE.md`, or a skill's references |
| Automated check | A mistake a tool could have caught | A hook in `.claude/hooks/` or a step in `.claude/scripts/build-solution.mjs`. Read the existing hooks and build script first — an existing check that is unwired or broken is the finding, not a new one |
| Coding standard | A judgement-call mistake no tool can catch | The matching `wp-*` standard skill; a rule specific to one module goes to that `MODULE.md` Local conventions |
| Module memory | A trap specific to one module | `MODULE.md` Known gotchas — only after the mechanical test below says no check can catch it |
| Steering weight | An always-on line (anything `@import`ed by `CLAUDE.md`) changed nothing this session, or only matters at one step | Delete it, or move it to an on-demand file or skill |
| Tool economy | A tool call cost far more than it returned | The script or skill that issued it |
| Information access | A fact the agent needed was out of reach | Make it reachable: tee a log to a file, a read-only query path, or write down where it lives |

**Mechanical test — run it before proposing any prose rule.** A fixed pattern (a banned API, a
config format, a file location, a naming shape) gets a deterministic check that can fail. Prose
is only for judgement calls. `block-secrets.mjs` and `connstr-check.mjs` are the house examples.

**Deletion test — run it on every always-on line the candidate touches.** Would removing the line
change what the agent does? No → propose deleting it. A hook that fired on good work this session
is a candidate for narrowing or removal, with that firing as its evidence.

## Step 4 · Present, then let the user pick

Rank by cost × chance of recurrence, at most 5. One row each:

| # | Moment (evidence) | Category | Proposed change | Destination | Owner |
|---|---|---|---|---|---|

The rank is a first draft — say when a quiet, expensive mistake was ranked above a loud, cheap one.
Ask which to apply through `AskUserQuestion` with `multiSelect: true`.

## Step 5 · Route and apply only what was picked

`SYNC-MANIFEST.md` decides the owner:

- **Project-owned** (module folders, `project-memory/stack-architecture.md`, the project half of
  `CLAUDE.md`) → edit here.
- **Template-owned** (a ✅ path: `.claude/rules/`, `.claude/skills/`, `.claude/hooks/`,
  `.claude/scripts/`, `example-module/`) in a project → list the exact change (file, before →
  after) for the master; a project edit is overwritten by the next `/wp-update-from-master`.
- **Template-owned, in the master** (its root holds the master-only `README.md` and `LICENSE`) →
  edit, and bump the manifest's version per its Version policy.

A new check runs once against the repo, and its hits are reported, before it is left to block anything.

## Step 6 · Handoff

Each applied change is a Done leaf. A template change waiting for the master → open: You now = make
it in the master (or say go to have Claude do it there), Next = `/wp-update-from-master` in each
project. Nothing picked → closed.

One session per run: checks added in earlier sessions are pruned by hand when they fire on good work.
