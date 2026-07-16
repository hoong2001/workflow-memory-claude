---
name: workspace-module-plan-discuss
description: Talk a module-level requirement into a work-ready plan document - the ONLY on-ramp for module work docs (replaces the old workspace-module-task-brief and workspace-module-grill-with-docs). Adaptive depth via five-element gap detection (Goal, Background, Material, Boundary, Definition of Done) against module docs and real code - a trivial bug fix converges in one confirmation round (mini plan), a conflicting approach gets challenged point by point, genuinely blank elements get interviewed one at a time. Entry requires the user to state a purpose/goal/requirement first. Lands plans/<name>-<date>-<slug>.md in the target module. Use whenever a module-level task needs a plan before coding. Do NOT use for a whole-system spec (that is /workspace-system-spec-discuss), and do NOT use when a plan already exists and only the technical cut is missing (that is /workspace-module-technical-design).
---

<what-to-do>

Converge a stated module-level requirement into a work-ready plan in the module's `plans/` folder. The flow is always: **goal stated → infer & reason → (on rejection) 4 options + 1 custom → interview only the gaps → confirm → write the plan.** Depth is never chosen up front — it emerges from how many gaps and conflicts the detection pass finds.

**Entry requirement — no goal, no session.** The user must state a purpose / goal / requirement before this skill does anything. If it is missing, ask for it in one line and wait. Do not guess a goal on the user's behalf.

**Detection over judgment.** Never classify the requirement as "clear" or "fuzzy" by impression. Instead, test each of the five elements individually (Step 2): an element is CLEAR only if it can be filled from the user's statement + module docs + code AND survives a contradiction check; otherwise it is a GAP. The gap list — not a vibe — decides how deep the session goes.

**Question pattern (every question in this skill):**
1. **Infer first** — state your recommended answer with the reasoning (from the docs, the code, or the constraints). Let the user simply accept it.
2. **Options on rejection** — if the user rejects or doubts the inference, immediately present **4 concrete alternative options plus 1 free-form custom choice** (when the AskUserQuestion tool is available, use it — put your recommendation first with "(Recommended)"; its built-in "Other" serves as the custom choice). Each option must be a real, distinct direction with a one-line trade-off — never filler to pad the count.

Ask one question at a time, waiting for the answer before continuing. If a question can be answered by exploring the codebase or docs, explore instead of asking.

</what-to-do>

<supporting-info>

## Step 0 — Preconditions

- **Goal stated?** If the user has not provided a purpose / goal / requirement, ask for it and stop until it arrives.
- **Hard rules loaded** — `.claude/workspace-project-stack-architecture.md` is non-negotiable; every inference and option must already respect it.
- **Target module identified** — if ambiguous, resolve it first (Module Map in root `CLAUDE.md`).

## Step 1 — Evidence before questions

Read the target module's memory BEFORE asking anything: `MODULE.md` (local conventions + known gotchas), `<name>-flow.md`, recent `impl/` records (prior decisions that constrain this task), `schema/` and `references/` if relevant, and the real code around the suspected cut point. Most "questions" die here — the docs or the code already answer them.

If the code is unfamiliar and no flow doc exists, route through `/workspace-module-code-trace-flow` first to extract the flow, then come back.

## Step 2 — Five-element gap detection

Test each element against (user statement + docs + code):

| Element | CLEAR when... |
|---|---|
| **Goal** | the what + why is stated or follows unambiguously |
| **Background** | the current behavior / trigger is known from docs, code, or the statement |
| **Material** | the inputs (files, tables, schemas, references) are identified |
| **Boundary** | what is out of scope is explicit or safely inferable |
| **Definition of Done** | a verifiable done-criterion can be written down |

An element is a **GAP** if it cannot be filled (blank) or if filling it contradicts `MODULE.md` rules, known gotchas, a prior `impl/` decision, the flow doc, or the actual code (conflict). Also sharpen terminology here — if the user's words and the module's documented terms diverge, flag it now.

## Step 3 — Converge (the gap list drives the depth)

- **All five CLEAR, cut point obvious** → present the filled five elements + the cut point in one block for a **single confirmation**. This is the trivial-fix fast path — still a confirmation, never a silent assumption.
- **Element fillable but conflicting** → challenge exactly that point, quoting the doc or code it collides with ("MODULE.md says times here are UTC, but your plan formats them in the repository layer — which is it?"). Resolve with the question pattern (infer → 4+1).
- **Element blank** → interview ONLY the blank elements, one at a time, with the question pattern.

Mixed results are normal: two blanks + one conflict = two interview questions + one challenge. Loop until all five are CLEAR and conflicts are zero, then do a final confirmation of the assembled plan.

## Step 4 — Write the plan and hand off

Save to `.claude/modules/<name>/plans/<name>-<date>-<slug>.md` — same naming as the future paired `impl/` record (written by `/workspace-module-save-implementation` at wrap-up).

The plan must cover: the goal, the decisions made **+ why** (this framework has no ADR layer — a decision worth remembering, hard to reverse, or born of a real trade-off is recorded here as decision + why), where to cut (files/methods), and the definition of done. **Length scales with content** — a trivial fix yields a mini plan (one line per element + the cut point); a complex task grows naturally. Use project-root-relative paths only (see `workspace-doc-relative-paths.md`).

If the technical cut (API / classes / SQL / frontend) still needs nailing down, route to `/workspace-module-technical-design` — it appends a "Technical Design" section to this SAME plan file.

</supporting-info>
