---
name: workspace-module-save-implementation
description: Project-bound version of save-implementation for workflow-memory-claude. Saves the implementation record to the module's impl/ folder using this project's fixed path convention, syncs the paired plan document, AND — the reason this project version exists — lightweight-updates the module's <name>-flow.md handover map whenever the change altered how the module works. Use this INSTEAD of the generic /save-implementation in this project. NEVER auto-run this skill - the trigger belongs to the user. After completing a feature module, a refactor, or a significant bug fix, REMIND the user in one line that the impl record is ready to be saved, and run only when they say go (or explicitly invoke it).
---

# Workspace Save Implementation

Project-bound replacement for the generic `save-implementation` skill. Two differences from the generic one:

1. **Fixed paths** — no path detection. This project's layout is known, so paths are hardcoded to the module convention.
2. **flow.md sync (the whole point)** — the module's `<name>-flow.md` handover map has historically gone stale because updating it lived in a wrap-up step that got skipped. This skill folds a *lightweight* flow.md refresh into the save step, which always runs.

## Preconditions

Identify the target **module name** (`<name>`) from the conversation — the module whose code was changed this task. All paths below live under `.claude/modules/<name>/`. If the module is ambiguous, ask which module before proceeding.

## Step 1 · Save the implementation record

Write to: `.claude/modules/<name>/impl/<name>-<YYYY-MM-DD>-<slug>.md`

- Use today's date. `<slug>` is a short kebab-case tag for this change; keep it identical to the paired plan file in `plans/` so they pair up.
- If a record for the **same** change already exists, update it — do not create a duplicate.

Every record MUST contain the four elements the project's memory rule requires:

```markdown
# Impl: <what was done, one line>

**Date**: YYYY-MM-DD
**Status**: Done | TODO left (describe) | Blocked (describe blocker)
**Plan**: plans/<name>-<date>-<slug>.md   (if one exists)

## What was done
(One line + bullets — the actual change.)

## Decisions + why
(Each technical/design choice tied to its reasoning. "What" is easy to reconstruct later;
"why this choice, not the alternative" is lost forever if not written now.)

## Files touched
| File | Method / area | What changed |
|---|---|---|
| Path/File.cs | `Method()` | ... |

## Known gotchas hit
(Anything that tripped you up — also backfill it into the module MODULE.md "Known gotchas".)
```

## Step 2 · Sync the paired plan (if one exists)

If `.claude/modules/<name>/plans/<name>-<date>-<slug>.md` exists, tick off its completed task checkboxes and set its status to `In Progress` / `Done` as appropriate.

## Step 3 · Sync `<name>-flow.md` (lightweight, incremental)

Open `.claude/modules/<name>/<name>-flow.md`. Remember what it is: a **handover map of how the module works NOW** — its main flow path and the files/methods it calls. It is **NOT a changelog** (history lives in `impl/`). So you patch the *current-state* description; you never append "on <date> I changed X".

Decide the scope of this task's change:

- **Purely internal change** — bug fix inside an existing method, wording, logic tweak with no new calls and no change to the flow path. → flow.md needs **no** change. State this explicitly in the report ("flow.md unchanged — internal-only change") and stop this step.

- **Structural change** — a new file/method entered the call chain, an existing one was removed or repurposed, or the main flow path shifted. → Patch only the affected parts of flow.md:
  - **Flow** section: adjust the narrative only where the path actually changed.
  - **Called files & methods** table: add rows for new `file:method` links, fix the "Role" of any that changed, remove rows for calls that no longer exist.
  - **Notes**: update only if a note is now wrong or a genuinely useful new one emerged.
  - Anchor every added/changed `file:method` to code you actually touched or read this task — no guessing (same rule as `/workspace-module-code-trace-flow`).

- **Large structural change** — the flow was substantially rewritten, or flow.md is clearly far from reality. Hand-patching is untrustworthy here. → Don't fake it: recommend the user run the full `/workspace-module-code-trace-flow` to re-derive the map, and note in the report that flow.md was left for a full re-trace.

Keep flow.md to the stable "how it works" parts. A specific change's "where to cut" belongs in that change's plan (`plans/`), not here.

## Step 4 · Report

Report all paths touched and the flow.md outcome, e.g.:

```
✅ Impl saved: .claude/modules/<name>/impl/<name>-2026-07-02-<slug>.md
✅ Plan synced: plans/<name>-2026-07-02-<slug>.md  (status → Done)
✅ flow.md: updated 2 call-chain rows (added OrderService.Validate, fixed Repository role)
   — or — flow.md unchanged (internal-only change)
   — or — flow.md left for full /workspace-module-code-trace-flow (large structural rewrite)
```

## Notes

- **Files touched** is the most critical field for a future session — always fill it.
- The **why** behind a decision matters more than the **what**.
- flow.md stays a handover map, not a diff log. If you catch yourself writing a date or "changed", you're doing it wrong — describe the current state instead.
