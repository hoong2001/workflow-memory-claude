# Update Memory (task wrap-up rule · Step 3)

Archive as soon as a task completes — don't wait until the session ends. Judge each item; touch files only as needed:

## 1. Record this task (core) → `.claude/modules/<name>/impl/<name>-<date>-<slug>.md` (`/workspace-save-implementation`)
> This skill also lightweight-syncs `<name>-flow.md` as part of saving (see Step 4) — that's why flow.md no longer drifts.
Every entry must include four things:
- **Date + one line**: when, and what was done.
- **Decision + why**: tie each technical/design choice to its reasoning ("what" is easy to reconstruct later; "why this choice" is lost forever if forgotten).
- **Status**: done? or any TODO left?
- **File links**: the key files / functions touched this time.

## 2. Hit a gotcha → backfill the "Known gotchas" list in `.claude/modules/<name>/MODULE.md`
So the same trap isn't hit again.

## 3. Plan saved? → `.claude/modules/<name>/plans/<name>-<date>-<slug>.md` (`/workspace-task-brief` or `/workspace-grill-with-docs`)
Use the same name as its impl file so they pair up.

## 4. Update the index
- New module → add a row to the module map in root `CLAUDE.md` (**path + one-line description**).
- Code changed → `<name>-flow.md` is already lightweight-synced by `/workspace-save-implementation` (Step 1). Only rerun the full `/workspace-code-trace-spec` if the change was a large structural rewrite the lightweight sync flagged as needing a full re-trace.
- Generic behavioral rule changed → update `.claude/rules/`.

## 5. Architecture changed → update `.claude/workspace-project-stack-architecture.md`

## 5b. System scope / capabilities changed → update `.claude/overview/system-overview-spec.md` (the functional WHAT)

## 6. Wrap-up check: is root `CLAUDE.md` still lean? If too long, move details to the module layer or `.claude/`, leaving only path links.

For each file changed, briefly say what changed and why. End with a one-line summary of what was archived this time.
