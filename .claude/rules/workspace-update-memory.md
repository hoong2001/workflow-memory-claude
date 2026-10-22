---
paths:
  - "project-memory/modules/**"
---

# Update Memory (task wrap-up rule · Step 3)

Judge each item; touch files only as needed. Branch D one-off tasks stop at `/wp-task-record`; nothing below applies.

## 1. Record this task (core) → `project-memory/modules/<name>/impl/<name>-<date>-<slug>.md` (`/wp-module-save-implementation` — REMIND the user it's ready; never auto-run, the trigger is theirs)
The record's sections are the template in `.claude/skills/wp-module-save-implementation/SKILL.md` Step 1; the skill also lightweight-syncs `<name>-flow.md` (item 4).

## 2. Hit a gotcha → backfill the "Known gotchas" list in `project-memory/modules/<name>/MODULE.md`
So the same trap isn't hit again.

## 3. Plan saved? → `project-memory/modules/<name>/plans/<name>-<date>-<slug>.md` (`/wp-module-plan-discuss`)
Use the same name as its impl file so they pair up. If `/wp-module-technical-design` was run,
its "Technical Design" and "Tasks" sections live inside this same plan file — never separate files.

Before you walk away, its status header and `> **Resume:**` line match reality — values and rules: **Status header** in `.claude/skills/_shared-conventions.md`.

## 4. Update the index
- New module → add a row to the module map in root `CLAUDE.md` (**path + one-line description**).
- Code changed → `<name>-flow.md` is already lightweight-synced by `/wp-module-save-implementation` (item 1). Only rerun the full `/wp-module-code-trace-flow` if the change was a large structural rewrite the lightweight sync flagged as needing a full re-trace.
- Generic behavioral rule changed → update `.claude/rules/`.

## 5. Architecture changed → update `project-memory/stack-architecture.md`

## 5b. Does this change the system's WHAT? → JUDGE, then REMIND (the user decides whether to write it)
The overview (`project-memory/overview/system-overview-spec.md`) is a CURATED system-level WHAT — NOT an
inventory of every module. A module built only for a bug fix or a small tweak rightly never appears
there, so never auto-write it. Instead, judge whether this task changed the system's capabilities or
scope (a new user-facing capability, a new subsystem, a changed WHAT) versus a localized fix. If it
looks overview-worthy, REMIND the user in one line — with your reasoning and a proposed one-line
entry — and let the USER decide whether to add it. Never edit the overview silently.

## 6. Wrap-up check: is root `CLAUDE.md` still lean? If too long, move details to the module layer or `.claude/`, leaving only path links.

## 7. Did the session hit friction? → REMIND `/wp-retro` (never auto-run)
A smooth session has nothing to teach, so remind only when at least one of these was observed in
this session — and name the one that fired:
- a build needed 3+ rounds, or stopped on the 5-round / same-error limit
- the user corrected a convention a rule, skill, or hook should already have enforced
- a hook fired, or fired on good work and had to be routed around
- one fact took 10+ search calls to find, or could not be found at all
- a decision-check conflict, or a new `Known gotchas` line in item 2

Remind once per session, after the item 1 reminder, as one line: `friction: <signal> → /wp-retro is
worth a run`. None observed → say nothing.

End with the handoff (**Handoff** in `.claude/skills/_shared-conventions.md`): an item 5b judgment waiting on the user is You now, with "on your yes, add the proposed line to the overview" as Next; an item 7 reminder is an ⚠️ Attention leaf (or Next, when nothing else is).
