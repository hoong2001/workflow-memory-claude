# Update Memory (task wrap-up rule · Step 3)

Archive as soon as a task completes — don't wait until the session ends. Judge each item; touch files only as needed:

> **First, a fork.** This file governs MODULE work (Step 2 Branches A–C). A one-off task that
> changed no module — a report run once, a data patch, an ad-hoc investigation (Branch D) —
> stops at `/wp-task-record`: one folder under `project-memory/tasks/`, and none of the items
> below apply. Nothing to archive here, nothing to index.

## 1. Record this task (core) → `project-memory/modules/<name>/impl/<name>-<date>-<slug>.md` (`/wp-module-save-implementation` — REMIND the user it's ready; never auto-run, the trigger is theirs)
> This skill also lightweight-syncs `<name>-flow.md` as part of saving (see Step 4) — that's why flow.md no longer drifts.
Every entry must include four things:
- **Date + one line**: when, and what was done.
- **Decision + why**: tie each technical/design choice to its reasoning ("what" is easy to reconstruct later; "why this choice" is lost forever if forgotten).
- **Status**: done? or any TODO left?
- **File links**: the key files / functions touched this time.

## 2. Hit a gotcha → backfill the "Known gotchas" list in `project-memory/modules/<name>/MODULE.md`
So the same trap isn't hit again.

## 3. Plan saved? → `project-memory/modules/<name>/plans/<name>-<date>-<slug>.md` (`/wp-module-plan-discuss`)
Use the same name as its impl file so they pair up. If `/wp-module-technical-design` was run,
its "Technical Design" and "Tasks" sections live inside this same plan file — never separate files.

**Its status header must reflect reality before you walk away** — `Done` when finished,
`Building N/M` when increments remain, `Blocked: <why>` when it stopped on something external.
The act loop maintains it as you build (Step 2) and `/wp-module-save-implementation` closes it
out. The point of the header is that a plan left mid-flight announces itself to the next session
instead of hiding: a stale `Planned` on half-built work is worse than no header at all.

## 4. Update the index
- New module → add a row to the module map in root `CLAUDE.md` (**path + one-line description**).
- Code changed → `<name>-flow.md` is already lightweight-synced by `/wp-module-save-implementation` (Step 1). Only rerun the full `/wp-module-code-trace-flow` if the change was a large structural rewrite the lightweight sync flagged as needing a full re-trace.
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

For each file changed, briefly say what changed and why. End with a one-line summary of what was archived this time. That report is the Done slot of the handoff (the **Handoff** section of `.claude/skills/_shared-conventions.md`): an overview judgment from item 5b waiting on the user → open, with that judgment as You now and "on your yes, add the proposed line to the overview" as Next; nothing waiting → closed.
