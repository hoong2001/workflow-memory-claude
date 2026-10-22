---
name: wp-module-save-implementation
description: Saves the implementation record to the module's impl/ folder, closes the paired plan by setting its status header to Done, and lightweight-updates the module's <name>-flow.md handover map whenever the change altered how the module works. It is a closing summary, not a mid-flight tracker - the Step 2 act loop maintains the plan's running status while building. NEVER auto-run this skill - the trigger belongs to the user. After a feature, refactor, or significant bug fix, REMIND the user in one line, and run only on their go.
---

# Module Save Implementation

Paths are fixed by the module convention below — no path detection.

## Preconditions

Identify the target **module name** (`<name>`) from the conversation — the module whose code was changed this task. All paths below live under `project-memory/modules/<name>/`. If the module is ambiguous, ask which module before proceeding.

## Step 1 · Save the implementation record

Write to: `project-memory/modules/<name>/impl/<name>-<YYYY-MM-DD>-<slug>.md`

- Use today's date. `<slug>` is a short kebab-case tag for this change; keep it identical to the paired plan file in `plans/` so they pair up.
- If a record for the **same** change already exists, update it — do not create a duplicate.

Every record MUST contain the elements the project's memory rule requires (`.claude/rules/workspace-update-memory.md` item 1):

```markdown
# Impl: <what was done, one line>

**Date**: YYYY-MM-DD
**Status**: Done | TODO left (describe) | Blocked (describe blocker)
**Plan**: plans/<name>-<date>-<slug>.md   (if one exists)

## What was done
(One line + bullets — the actual change.)

## Decisions + why
(Each technical/design choice tied to its reasoning. "What" is easy to reconstruct later;
"why this choice, not the alternative" is lost forever if not written now.
A decision that reverses an earlier record names it: "Overrides impl/<file>.md — <why>".)

## Ruled out
(Each option that was considered or tried and dropped, with why — so a later session does not
propose it again. Sources: the plan's rejected options and every approach that failed while
building. Write "None" when nothing was ruled out.)
- **<option>** — <why it was dropped>

## Files touched
| File | Method / area | What changed |
|---|---|---|
| Path/File.cs | `Method()` | ... |

## Known gotchas hit
(Anything that tripped you up — also backfill it into the module MODULE.md "Known gotchas".)
```

## Step 2 · Sync the paired plan (if one exists)

This skill closes a plan out; it does not track it mid-flight. The act loop already maintains
the plan's status header and its `✔` marks as increments land (`workspace-workflow.md` Step 2),
so there is one thing left to do here:

**Close the plan's status header** — the line directly under the H1 — to match the `**Status**`
line of the impl record you just wrote (shape, values and the Resume line: the **Status header**
section of `.claude/skills/_shared-conventions.md`):

```markdown
> **Status:** Done · **Updated:** <today>
```

Impl record `TODO left` → `Building`; `Blocked` → `Blocked · **Detail:** <the blocker>`. Never
`Done` while work remains.

**Before writing `Done`, check the plan's `## Decisions & open items` table for leftover `☐` rows.**
Each one is either a decision that was in fact made while building — write the answer + why into
its `Decision + why` cell and flip it to `☑`, since this is the last moment anyone remembers the
reasoning — or a question still genuinely open. A leftover `🟢` row (open, but it never blocked the
build) can close out as `Done` with that row still `☐`; say so in the impl record's `Status` line. A
leftover `🔴` row cannot: the header is `Blocked · **Detail:** <that item>`, not `Done`.

## Step 3 · Sync `<name>-flow.md` (lightweight, incremental)

Open `project-memory/modules/<name>/<name>-flow.md`. Remember what it is: a **handover map of how the module works NOW** — its main flow path and the files/methods it calls. It is **NOT a changelog** (history lives in `impl/`). So you patch the *current-state* description; you never append "on <date> I changed X".

Decide the scope of this task's change:

- **Purely internal change** — bug fix inside an existing method, wording, logic tweak with no new calls and no change to the flow path. → flow.md needs **no** change. State this explicitly in the report ("flow.md unchanged — internal-only change") and stop this step.

- **Structural change** — a new file/method entered the call chain, an existing one was removed or repurposed, or the main flow path shifted. → Patch only the affected parts of flow.md:
  - **Flow** section: adjust the narrative only where the path actually changed.
  - **Diagram** section: patch the Mermaid `sequenceDiagram` to match the new Flow (add, remove or rename the participants and arrows that changed). A linked archify HTML is not regenerated — add `(outdated: <date>)` to its link line instead.
  - **Called files & methods** table: add rows for new `file:method` links, fix the "Role" of any that changed, remove rows for calls that no longer exist.
  - **Shared symbols & their callers (fan-in)** table: if this change added or removed a caller of a shared symbol (`Base*`, `ConstValues/`, `Results/`, or any multi-caller method), patch that symbol's caller row. This table is the module's blast-radius map — a stale one is worse than none.
  - **Notes**: update only if a note is now wrong or a genuinely useful new one emerged.
  - Anchor every added/changed `file:method` to code you actually touched or read this task — no guessing (same rule as `/wp-module-code-trace-flow`).

- **Large structural change** — the flow was substantially rewritten, or flow.md is clearly far from reality. Hand-patching is untrustworthy here. → Don't fake it: recommend the user run the full `/wp-module-code-trace-flow` to re-derive the map, and note in the report that flow.md was left for a full re-trace.

## Step 4 · Report

Report all paths touched and the flow.md outcome as the handoff's Done leaves, e.g.:

```text
├─ ✅ Done
│  ├─ project-memory/modules/<name>/impl/<name>-2026-07-02-<slug>.md (64 lines, new) — impl record
│  ├─ plans/<name>-2026-07-02-<slug>.md (+1/−1) — status → Done
│  └─ <name>-flow.md (+3/−1) — <what changed in the map>
```

The flow.md leaf says instead `unchanged — internal-only change`, or `left for full
/wp-module-code-trace-flow — large structural rewrite`. Any other file this step touched
(MODULE.md gotchas, Module Map row) is a leaf of its own.

These leaves are the Done slot of the handoff (the **Handoff** section of
`.claude/skills/_shared-conventions.md`). Run the closed test, then finish:

- **Open** when something is still pending — **👉 You now** = the overview judgment that is the
  user's (`.claude/rules/workspace-update-memory.md` item 5b — give your reasoning and a proposed
  line), or `nothing`; **🔜 Next** = the live plan the work belongs to while it is not `Done`,
  otherwise "on your yes, add the proposed line to the overview".
- **Closed** when neither applies — a localized fix with no live plan the work belongs to ends with
  `└─ 🏁 Closed  nothing pending`
- A friction signal this session → the `/wp-retro` reminder of
  `.claude/rules/workspace-update-memory.md` item 7; the stop is then open.

## Notes

- **Files touched** is the most critical field for a future session — always fill it.
