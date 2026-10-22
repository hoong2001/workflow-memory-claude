---
name: wp-system-overview-spec-generator
description: Bootstrap a system from its spec: overview + module scaffolds, one sign-off.
disable-model-invocation: true
---

# System Overview & Spec Generator (System Bootstrap)

Turn an arbitrary external spec into **(1)** a filled-in **System Overview & Spec** file (the
single governance file answering **WHAT a system is and does**) **and (2)** the **scaffolded
modules** derived from it — in one run, with one human sign-off checkpoint.

## The boundaries

**WHAT, not HOW.** The overview answers what the system is and does. It must contain **zero**
stack / framework / layer / implementation detail — that is the architecture doc's job
(`project-memory/stack-architecture.md`). A spec almost always carries tech; it does
NOT get copied into the overview (see Step 4).

**Whole, not part.** The overview is the WHOLE system; a module is a COMPONENT. Component internals
stay in the module's docs, and the module index stays in root `CLAUDE.md` "Module Map".

**Tech binds to the module, not the overview.** Module-relevant technical detail travels with the
module — it is written into that module's `MODULE.md` when scaffolded (Step 7), never into the
overview.

## Workflow

### Step 0 — Confirm this is a system bootstrap (or a system expansion re-run)
This skill needs a reasonably **complete** spec (purpose, capabilities, ideally data entities). If
the spec is thin or fuzzy, stop and tell the user to run `/wp-system-spec-discuss` (discuss the spec into existence) instead of forcing a build.

Two run modes, same procedure:
- **First bootstrap** — no overview filled yet, no real modules exist.
- **Expansion re-run** — the system is live and a new expansion spec arrives. The overview is
  updated **in place** (§4/§5 grow; it stays ONE file per system).

### Step 1 — Load the skeleton
First bootstrap → read `assets/system-overview-spec.template.md`. Expansion re-run → read the live
`project-memory/overview/system-overview-spec.md` instead; its filled lines stay unless the new spec
changes them, and §4/§5 grow. Either way: preserve every heading and every `<!-- ... -->`
governance comment verbatim, and replace only `(TBD)` / placeholder lines or lines the new spec
changes. (Template missing → restore it first; a missing template is what lets HOW leak in.)

### Step 2 — Read and mine the external spec
Read the source document in full. Extract raw material for each target section using the
"Section extraction guide" below. Pull facts only — do not invent.

### Step 3 — Gap analysis (complete → proceed; gaps → ask first)
Classify each section: **Confident** (stated or follows unambiguously) or **Gap** (you would guess).
- A Gap in §1, §2 or §4 (what §5 and the scaffold are built from) → ask before generating, one
  Question pattern question per Gap (`.claude/skills/_shared-conventions.md`).
- A Gap in §3, §6 or §7 → write `(TBD — <what is needed>)` and continue; Step 8's checklist lists it.

### Step 4 — Tech reconciliation (keep HOW out of the overview)
Specs usually carry a tech stack / framework. Extract it, but **do not write it into the overview.**
Instead diff it against `project-memory/stack-architecture.md` and prepare two lists:
- **Overlaps** — spec tech that matches the architecture doc (consistent; just confirm).
- **Inconsistencies** — spec tech that conflicts with, or is missing from, the architecture doc.

Rules: never auto-edit the architecture doc; never silently discard the spec's tech. Whether the
architecture doc should change is the **user's** decision — you only surface the diff. Hold both
lists for the checkpoint in Step 6.

### Step 5 — Fill the overview (WHAT only)
Write §1–§4, §6 and §7 per the guide below; §5 stays `(TBD)` until the Step 6 sign-off — Step 7
writes it. Obey WHAT-not-HOW / whole-not-part
throughout. One idea per bullet. Flag any assumption inline.

### Step 6 — ONE sign-off checkpoint (tech diff + module decomposition)
Group the §4 capabilities into modules (§5). Then present a **single** checkpoint and **wait for
the user to verify and sign off**. Do NOT scaffold anything or touch the Module Map before the nod.
Present together:
- **(a) Tech Reconciliation Report** — the Overlaps + Inconsistencies from Step 4, for the user to
  verify and decide (e.g. update the architecture doc, or accept as-is).
- **(b) Module Decomposition Proposal** — each proposed module as `name → capabilities it owns →
  key dependencies`, and **mark each one NEW or EXISTING** (whether `project-memory/modules/<name>/`
  already exists).
  Module boundaries are an architecture decision; the user may adjust them here.

### Step 7 — One-shot build (only after sign-off)

**Idempotence hard rule: an EXISTING module folder is NEVER re-scaffolded or template-overwritten.**
Its `MODULE.md`, `plans/`, `impl/`, `schema/`, `references/`, and flow doc are the project's
accumulated memory — there is no undo on a synced drive. Before touching any module, check whether
`project-memory/modules/<name>/` already exists; that check decides the branch below.

For each agreed **NEW** module:
1. **Scaffold** `project-memory/modules/<name>/` by copying the example-module template
   (`project-memory/modules/example-module/`) and renaming per its header note.
2. **Seed** the module's `MODULE.md`: fill "What this module does" from the spec, and **bind the
   module-relevant tech into its "Local conventions"** (tech travels with the module; the overview
   stays HOW-free).
3. **Register** the module in root `CLAUDE.md` "Module Map" (one row: name · one-line responsibility
   · path · deep-doc path).

For each agreed **EXISTING** module (expansion touches it): append the new capabilities to its
`MODULE.md` "What this module does" / "Local conventions", and refresh its Module Map row if the
one-line responsibility changed; the actual feature work then flows through the normal Step 2 loop.

Also record the agreed decomposition into overview **§5 Module Composition** (how modules fit; not
the index/paths).

### Step 8 — Self-check, then deliver
Run the "Quality checklist". Save the overview as `project-memory/overview/system-overview-spec.md` (or the
path the user specifies). Leave explicit `(TBD — <what is still needed>)` for anything unresolved
rather than a confident guess.

Close with the handoff — the **Handoff** section of `.claude/skills/_shared-conventions.md`:
Done = the overview path, the modules scaffolded (NEW) or updated (EXISTING), and the Module Map
rows added; You now = review the overview's `TBD` markers; Next = pick the first module to build
and run `/wp-module-plan-discuss` on it (name the module you recommend and why).

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
   here becomes a `project-memory/modules/<name>/` folder. Do NOT restate the module index (that's root
   CLAUDE.md Module Map). This is what you get sign-off on in Step 6.
6. **External Integrations** — External systems, APIs, file feeds the system talks to.
7. **Domain Glossary** — Domain terms a new reader needs, each as `term — meaning`.

## Quality checklist
- Every `(TBD)` either filled or replaced with `(TBD — <specific missing input>)`.
- **No HOW/stack/layer detail in the overview** — the spec's tech went to the Step 4 reconciliation
  report, not into the overview.
- The architecture doc was **not** auto-edited; any change to it was the user's explicit decision.
- §4 capabilities and §5 modules are consistent — every module traces back to capabilities.
- Every signed-off NEW module is both **scaffolded** and **registered in the Module Map**, and §5
  reflects the same set.
- Module-relevant tech lives in each module's `MODULE.md` (Local conventions), not the overview.
- No component-internal detail or duplicated module paths in the overview.
- All template headings and governance comments preserved verbatim; first-use acronyms expanded.

## Notes
- Write filled content in English, whatever the source's language
  (`.claude/rules/workspace-doc-writing-style.md`).
- If the user pastes the spec inline instead of as a file, treat the pasted text as the source.
- If multiple candidate "systems" appear in one source, confirm which one this overview is for —
  this file is ONE per system.
