---
name: wp-retro
description: Look back over one coding session and propose changes to the workflow environment — rules, skills, hooks, the build script, module memory — so the friction it hit does not recur. Every candidate is traced to a moment in the session's own record, mechanical mistakes become checks rather than prose, and nothing changes until the user picks. Use when the user says "retro", "retrospective", "回顧", "檢討今次 session", "點樣下次唔再中", or after the wrap-up reminder named a friction signal. Do NOT use to review the code itself (use a code review), to record what was built (/wp-module-save-implementation, /wp-task-record), and never auto-run it - the trigger belongs to the user.
---

# Retro — fix the environment, not the code

The code the session produced is already handled: the build checked it, the user tested it, the
impl record or `TASK.md` saved it. This skill asks a different question — **what in the workflow
let the friction happen** — and proposes the pointer, check, or rule that prevents it next time.

Adapted from Matt Pocock's `retro` (`mattpocock/skills`), re-pointed at this workflow's own
destinations: there is no `CODING_STANDARDS.md` or `AGENTS.md` here, and the coding standards are
the auto-triggered `wp-*` skills.

## Step 1 · Pick the session

Default to the current session. If the user names another, read its log under
`~/.claude/projects/<project-slug>/<session-id>.jsonl`. Also read what that session wrote: the
paired impl record or `TASK.md`, and any `Known gotchas` line it added to a `MODULE.md`.

A session that has scrolled out of context → ask the user to start a fresh session and point
`/wp-retro` at the old log, rather than reconstructing it from memory.

## Step 2 · Collect friction moments, with evidence

List every moment the session struggled. Each one carries its evidence — the tool call, the error
text, or the user's own words, quoted. **No evidence, no candidate.** Generic advice that fits any
session ("add more tests", "document better") is discarded here, before it reaches the user.

Typical moments:

- a build that needed 3+ rounds, or stopped on the 5-round / same-error limit
- the user corrected a convention a rule, skill, or hook should already have enforced
- a hook fired — or fired on good work and had to be routed around
- one fact took 10+ search calls to find, or could not be found at all
- a decision-check conflict, or a new `Known gotchas` line

A smooth session yields no moments. That is a valid result: say so in one line and close.

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

## Step 4 · Route each candidate: template or project

`SYNC-MANIFEST.md` decides. A change to a ✅ path (`.claude/rules/`, `.claude/skills/`,
`.claude/hooks/`, `.claude/scripts/`, `example-module/`) belongs in the **master** repo: edited in a
project, the next `/wp-update-from-master` overwrites it. Everything else — module folders,
`project-memory/stack-architecture.md`, the project half of `CLAUDE.md` — is the project's own and
is edited here.

The current repo is the master when its root holds the master-only `README.md` and `LICENSE`
(`SYNC-MANIFEST.md` → Master-only). There, template changes are edited directly and the
manifest's version is bumped per its Version policy.

## Step 5 · Present, then let the user pick

Rank by cost × chance of recurrence, at most 5. One row each:

| # | Moment (evidence) | Category | Proposed change | Destination | Owner |
|---|---|---|---|---|---|

The severity order is a first draft — a quiet, expensive mistake can deserve a higher rank than a
loud, cheap one, so say when you weighed it that way.

Then ask which to apply through `AskUserQuestion` with `multiSelect: true`: the top candidates as
options, the recommended ones marked "(Recommended)", and `Re-infer` last (the **Question pattern**
in `.claude/skills/_shared-conventions.md`).

## Step 6 · Apply only what was picked

- **Project-owned** → edit now, following `.claude/rules/workspace-plan-impl.md` (sweep every doc
  that restates a changed convention).
- **Template-owned, in a project** → do not edit the ✅ path. List the exact change (file, before →
  after) so it can be made in the master.
- **Template-owned, in the master** → edit, bump the version in `SYNC-MANIFEST.md`, sweep.
- A new check is code like any other: run it against the repo once and report what it flags before
  it is left to block anything.

## Step 7 · Handoff

Per the **Handoff** section of `.claude/skills/_shared-conventions.md`. Each applied change is a Done
leaf. A template change waiting for the master → open: You now = make it in the master (or say go to
have Claude do it there), Next = `/wp-update-from-master` in each project. Nothing picked, or no
friction found → `└─ 🏁 Closed  nothing pending`.

## Boundaries

- One session per run. The skill does not audit checks added in earlier sessions; prune those by
  hand when they fire on good work.
- It never edits application code and never writes an impl record — those belong to the act loop
  and `/wp-module-save-implementation`.
- It is not a memory system: it records nothing about what happened, only changes what will.
- Trigger is the user's. The wrap-up may remind (`.claude/rules/workspace-update-memory.md` item 7);
  it never runs it.
