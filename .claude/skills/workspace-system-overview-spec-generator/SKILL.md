---
name: workspace-system-overview-spec-generator
description: Bootstrap a brand-new system from a spec document — generate the System Overview & Spec governance file (the WHAT) AND scaffold the modules derived from it. Use this skill whenever the user provides a reasonably complete spec, design doc, PRD, requirements file, README, or Spec-kit output for a NEW system and wants it turned into the "system overview spec" / "治理檔 / 總覽 spec" PLUS the corresponding module structure. Also trigger on "fill in the spec template", "convert this into our system spec", "draft the system overview", or "build the modules from this spec". It reconciles the spec's tech stack against the project architecture doc and surfaces overlaps/conflicts for sign-off. Bound to the project workflow's "Brand-new system" bootstrap. Do NOT use for a single module/component spec, for editing the architecture (HOW) doc itself, or for the module index.
---

# System Overview & Spec Generator (System Bootstrap)

Turn an arbitrary external spec into **(1)** a filled-in **System Overview & Spec** file (the
single governance file answering **WHAT a system is and does**) **and (2)** the **scaffolded
modules** derived from it — in one run, with one human sign-off checkpoint.

This skill is the **executor of the "Brand-new system" bootstrap** defined in
`.claude/rules/workspace-workflow.md` (Step 1). That workflow file is the single source of the
procedure; this skill carries it out. If the two ever diverge, the workflow file wins — update
this skill to match it, not the other way around.

The canonical overview structure lives in `assets/system-overview-spec.template.md`. Always start
from that file so section order, headings, and the embedded governance comments stay intact.

## The two boundaries that make this work

**WHAT, not HOW.** The overview answers what the system is and does. It must contain **zero**
stack / framework / layer / implementation detail — that is the architecture doc's job
(`.claude/workspace-project-stack-architecture.md`). A spec almost always carries tech; it does
NOT get copied into the overview (see Step 4).

**Whole, not part.** The overview is the WHOLE system. A module is a COMPONENT. Never nest the
overview inside a module, never pull component internals into it, never restate the module index
(that lives in root `CLAUDE.md` "Module Map").

**Tech binds to the module, not the overview.** Module-relevant technical detail travels with the
module — it is written into that module's `MODULE.md` when scaffolded (Step 7), never into the
overview.

## Workflow

### Step 0 — Confirm this is a system bootstrap
This skill needs a reasonably **complete** spec (purpose, capabilities, ideally data entities). If
the spec is thin or fuzzy, stop and route to `/workspace-spec-discuss` (discuss the spec into existence) instead of forcing a build.

### Step 1 — Load the template
Read `assets/system-overview-spec.template.md`. This is the skeleton you fill. Preserve every
heading and every `<!-- ... -->` governance comment verbatim; you only replace `(TBD)` /
placeholder lines with real content. (If this file is missing, do not improvise — restore it
first; a missing template is what lets HOW leak in.)

### Step 2 — Read and mine the external spec
Read the source document in full. Extract raw material for each target section using the
"Section extraction guide" below. Pull facts only — do not invent.

### Step 3 — Gap analysis (complete → proceed; gaps → ask first)
Classify each section: **Confident** (stated or follows unambiguously) or **Gap** (you would guess).
- No meaningful gaps → continue.
- Meaningful gaps → list them and ask focused questions BEFORE generating. Offer concrete options
  so the user is never left guessing. Once answered, continue.

### Step 4 — Tech reconciliation (keep HOW out of the overview)
Specs usually carry a tech stack / framework. Extract it, but **do not write it into the overview.**
Instead diff it against `.claude/workspace-project-stack-architecture.md` and prepare two lists:
- **Overlaps** — spec tech that matches the architecture doc (consistent; just confirm).
- **Inconsistencies** — spec tech that conflicts with, or is missing from, the architecture doc.

Rules: never auto-edit the architecture doc; never silently discard the spec's tech. Whether the
architecture doc should change is the **user's** decision — you only surface the diff. Hold both
lists for the checkpoint in Step 6.

### Step 5 — Fill the overview (WHAT only)
Write the template section by section per the guide below. Obey WHAT-not-HOW / whole-not-part
throughout. One idea per bullet. Flag any assumption inline.

### Step 6 — ONE sign-off checkpoint (tech diff + module decomposition)
Group the §4 capabilities into modules (§5). Then present a **single** checkpoint and **wait for
the user to verify and sign off**. Do NOT scaffold anything or touch the Module Map before the nod.
Present together:
- **(a) Tech Reconciliation Report** — the Overlaps + Inconsistencies from Step 4, for the user to
  verify and decide (e.g. update the architecture doc, or accept as-is).
- **(b) Module Decomposition Proposal** — each proposed module as `name → capabilities it owns →
  key dependencies`. Module boundaries are an architecture decision; the user may adjust them here.

### Step 7 — One-shot build (only after sign-off)
For each agreed module:
1. **Scaffold** `.claude/modules/<name>/` by copying the example-module template
   (`.claude/modules/example-module/`) and renaming per its header note.
2. **Seed** the module's `MODULE.md`: fill "What this module does" from the spec, and **bind the
   module-relevant tech into its "Local conventions"** (tech travels with the module; the overview
   stays HOW-free).
3. **Register** the module in root `CLAUDE.md` "Module Map" (one row: name · one-line responsibility
   · path · deep-doc path).

Also record the agreed decomposition into overview **§5 Module Composition** (how modules fit; not
the index/paths).

### Step 8 — Self-check, then deliver
Run the "Quality checklist". Save the overview as `.claude/overview/system-overview-spec.md` (or the
path the user specifies). Leave explicit `(TBD — <what is still needed>)` for anything unresolved
rather than a confident guess.

## Section extraction guide

Map source material into the sections. `§4 → §5` is the spine: capabilities drive modules.

1. **What this system is** — One sentence: *"This system is a ___, for ___, solving ___."* From the
   doc's purpose / intro / problem statement.
2. **Scope** — In-scope = what it delivers; Out-of-scope = explicit exclusions / non-goals. If none
   stated, out-of-scope is often a gap worth asking.
3. **Actors / Users** — Who uses it and in what role (human roles, calling systems, operators).
4. **Capability Map** — Major **functional areas** (the WHAT). One bullet per capability. Strip any
   HOW. Verbs of *function* ("manages X", "reports Y"), not of *implementation*.
5. **Module Composition** — Group §4 capabilities into modules and show how they fit. Each module
   here becomes a `.claude/modules/<name>/` folder. Do NOT restate the module index (that's root
   CLAUDE.md Module Map). This is what you get sign-off on in Step 6.
6. **External Integrations** — External systems, APIs, file feeds the system talks to.
7. **Domain Glossary** — Domain terms a new reader needs, each as `term — meaning`.

## Quality checklist
- Every `(TBD)` either filled or replaced with `(TBD — <specific missing input>)`.
- **No HOW/stack/layer detail in the overview** — the spec's tech went to the Step 4 reconciliation
  report, not into the overview.
- The architecture doc was **not** auto-edited; any change to it was the user's explicit decision.
- §4 capabilities and §5 modules are consistent — every module traces back to capabilities.
- Every signed-off module is both **scaffolded** and **registered in the Module Map**, and §5
  reflects the same set.
- Module-relevant tech lives in each module's `MODULE.md` (Local conventions), not the overview.
- No component-internal detail or duplicated module paths in the overview.
- All template headings and governance comments preserved verbatim; first-use acronyms expanded.

## Notes
- Match the source document's language for filled content when it is not English; keep the
  template's English headings/comments as-is.
- If the user pastes the spec inline instead of as a file, treat the pasted text as the source.
- If multiple candidate "systems" appear in one source, confirm which one this overview is for —
  this file is ONE per system.
