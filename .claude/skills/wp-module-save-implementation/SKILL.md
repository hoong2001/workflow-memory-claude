---
name: wp-module-save-implementation
description: Close a module task: impl record, plan → Done, flow-map sync.
disable-model-invocation: true
---

# Module Save Implementation

Paths are fixed by the module convention below — no path detection.

## Preconditions

Identify the target **module name** (`<name>`) from the conversation — the module whose code was changed this task. All paths below live under `project-memory/modules/<name>/`. If the module is ambiguous, ask which module before proceeding.

## Step 1 · Save the implementation record

Write to: `project-memory/modules/<name>/impl/<name>-<YYYY-MM-DD>-<slug>.md`

- Use today's date. `<slug>` is a short kebab-case tag for this change; keep it identical to the paired plan file in `plans/` so they pair up.

Every record holds the sections below. **Files touched** has one row per file the change touched — every one: the Step 2 decision check finds this record by `grep -l "<FileName>"` (`.claude/rules/workspace-workflow.md`).

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

## Change map
(A Mermaid `flowchart` of the structural change — files and calls added, removed or rerouted;
**Diagrams** in `.claude/rules/workspace-doc-writing-style.md`. An internal-only change writes
`None — internal-only change`.)

## Deployment
(What a person does outside the build, in order, paths from the project root: each `.sql` to run
— whichever module's `schema/` holds it — config key, file to move, app to deploy. Copy it from
the plan's `### Deployment`; a plan without that section gets it built from this record's
`Files touched` (every `.sql` and config file) plus the order the work needed. `None` when there
is nothing.)
1. <environment> — run `project-memory/modules/<name>/schema/<file>.sql`

## Known gotchas hit
(Anything that tripped you up — also backfill it into the module MODULE.md "Known gotchas".)
```

## Step 2 · Sync the paired plan (if one exists)

Run in this order; the header is written last.

1. **Leftover rows.** A `☐` row in `## Tasks` is work remaining → the impl record's Status is
   `TODO left`. A `☐` row in `## Decisions & open items` is either a decision made while building —
   write its answer + why into `Decision + why` and flip it to `☑`; this is the last moment the
   reasoning is remembered — or still open: a `🟢` row may stay `☐` (say so in the impl Status line),
   a `🔴` row makes the impl `Blocked`.
2. **Header.** Match the impl record's `**Status**`: `Done` → `> **Status:** Done · **Updated:** <today>`
   and delete the `> **Resume:**` line; `TODO left` → `Building`; `Blocked` →
   `Blocked · **Detail:** <the blocker>`. Shape and values: **Status header** in
   `.claude/skills/_shared-conventions.md`.

## Step 3 · Sync `<name>-flow.md` (lightweight, incremental)

Open `project-memory/modules/<name>/<name>-flow.md`. Remember what it is: a **handover map of how the module works NOW** — its main flow path and the files/methods it calls. It is **NOT a changelog** (history lives in `impl/`). So you patch the *current-state* description; you never append "on <date> I changed X".

Decide the scope of this task's change:

- **Purely internal change** — bug fix inside an existing method, wording, logic tweak with no new calls and no change to the flow path. → flow.md needs **no** change. State this explicitly in the report ("flow.md unchanged — internal-only change") and stop this step.

- **Structural change** — a new file/method entered the call chain, an existing one was removed or repurposed, or the main flow path shifted. → Patch only the affected parts of flow.md:
  - **Flow** section (only a doc that still has one): adjust the narrative only where the path actually changed.
  - **Diagram** section: patch the Mermaid `sequenceDiagram` to match the new call order (add, remove or rename the participants and arrows that changed). A linked archify HTML is not regenerated — add `(outdated: <date>)` to its link line instead.
  - **Data flow** section (only a doc that has one): patch the `flowchart LR` where a table, view or file read or write changed.
  - **Called files & methods** table: add rows for new `file:method` links, fix the `#` order and the "Role" of any that changed, remove rows for calls that no longer exist.
  - A flow.md in the old shape keeps it: add no Diagram or Data flow section it lacks unless the user asks.
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

**Show the deployment steps.** Write the record's `## Deployment` list into the reply body, in
full — order, environment, project-root path and file name for each step. A finished plan means
the user is about to go live or to UAT, and this list is what they work from. `None` → say so in
one line.

These leaves are the Done slot of the handoff (the **Handoff** section of
`.claude/skills/_shared-conventions.md`). Run the closed test, then finish:

- **Open** when something is still pending — **👉 You now** = the deployment steps when the record
  lists any (point to the list above), plus the overview judgment that is the
  user's (`.claude/rules/workspace-update-memory.md` item 5b — give your reasoning and a proposed
  line), or `nothing`; **🔜 Next** = the live plan the work belongs to while it is not `Done`,
  otherwise "on your yes, add the proposed line to the overview".
- **Closed** when neither applies and Deployment is `None` — a localized fix with no live plan the work belongs to ends with
  `└─ 🏁 Closed  nothing pending`
- A friction signal this session (`.claude/rules/workspace-update-memory.md` item 7) → remind the
  user to type `/wp-retro`; the stop is then open.
