---
name: workspace-task-brief
description: Guide the user through a five-element framework (Goal, Background, Material, Boundary, Definition of Done) to turn vague requirements into a structured task brief (brief.md). Use this skill whenever the user starts a new non-trivial task with vague requirements, lacks clear completion criteria, says "help me plan", "I want to build...", "define this task", or "write a brief", or when a task is complex enough to warrant clarification before execution. Do NOT trigger for trivial single-step execution tasks (fix a typo, run a command, a clearly-specified one-line change).
---

# Task Brief — Five-Element Guided Briefing

## Core Idea

Vague requirements produce polished but hollow output. This skill does not execute the task itself; it first guides the user to clarify the request into five elements, then produces a `brief.md`. Subsequent execution (in this conversation or elsewhere) should treat that brief as the single source of truth.

The five elements, in fixed order:

1. **Goal** — most important. Without a goal, the other four are meaningless.
2. **Background**
3. **Material**
4. **Boundary**
5. **Definition of Done (DoD)**

## Workflow

### Step 0: Pre-scan (no questions yet)

Read the user's original input and infer all five elements. Tag each with a status:

- `known` — explicitly stated by the user
- `inferred` — reasonably deduced from context, pending confirmation
- `missing` — no information at all

Show the user this pre-scan as a short five-line list, then begin guiding from Goal. **Never re-ask anything tagged `known`** — just ask for a one-line confirmation during that element's round.

### Steps 1–5: Element-by-element guidance

Strictly in order, one element per round. Rules for each round:

- Ask **2 to 5** guiding questions, ordered by impact on the task — highest impact first.
- Every question must include:
  - **Inference**: a reasonable guess based on available information ("I assume you mean...")
  - **Options**: exactly 3 concrete choices plus one open option for the user's own answer (when the AskUserQuestion tool is available, use it — put the inferred answer first with "(Recommended)"; its built-in "Other" serves as the open option). Let the user *pick* instead of forcing them to *compose*. Each choice must be a real, distinct direction — never filler to pad the count.
- Scale question count to the gap: if information is mostly sufficient, ask 2 confirmation questions; only use all 5 when the element is entirely missing.
- The user may say "clear enough" / "skip" / "next" at any time — immediately lock the element with its current content and move on. **Do not press further. Do not plead.**
- Before locking, if the element fails its quality bar (below), give a one-sentence risk warning (e.g., "Goal still doesn't name the beneficiary — I'll assume it's you, OK?"). Warn once, then comply.
- After each element is locked, restate the locked content in 1–2 sentences, then move to the next element.

### Step 6: Produce brief.md

Once all five elements are locked, generate `brief.md` using the output template below and ask the user for final confirmation. After confirmation, the brief becomes the sole basis for execution.

## Element Length Limit

**Each element's final content in `brief.md` must not exceed 255 characters** (counting CJK characters as one character each). This is a forcing function for clarity, not a formality:

- During synthesis, distill the user's answers — do not transcribe them.
- If content genuinely cannot fit, the overflow belongs elsewhere: detailed lists go into referenced files listed under Material; secondary conditions go into the Appendix.
- If an element cannot be expressed within 255 characters, treat it as a signal the element is not yet truly clarified — say so, and propose a sharper formulation.
- The limit applies to each element's body content, excluding the heading line.

## Question Bank per Element

For each element: candidate questions (pick from these — no need to ask all) and a quality bar (the objective standard for "clear enough").

### 1. Goal

Candidate questions:
- After this task is done, what will be different? (outcome-oriented, not activity-oriented)
- Who is the end beneficiary / user?
- Is this an end in itself, or a means to something else? What is the real underlying problem?
- If only one thing could be achieved, which one?

Quality bar: can be stated in one sentence as "for whom, doing what, achieving what effect".

### 2. Background

Candidate questions:
- Why now? What triggered this?
- What has been tried before? Why did it fail?
- What prior decisions or premises must not be overturned?
- Who will review the result, and in what setting will it be used?

Quality bar: an executor would not make wrong assumptions due to missing context.

### 3. Material

Candidate questions:
- What existing documents, data, code, or examples are available?
- When materials conflict, which one is authoritative?
- What is still missing? Who supplies it, and when?

Quality bar: a material list exists with each item's purpose noted; missing materials have a resolution plan.

### 4. Boundary

Candidate questions:
- What is explicitly **out of scope**?
- Any hard constraints on technology, tools, format, or style?
- Limits on time, budget, or length?
- Any red lines that must never be crossed? (security, compliance, untouchable components)

Quality bar: at least one explicit "will not do"; hard constraints are listed.

### 5. Definition of Done (DoD)

Candidate questions:
- What counts as passing acceptance? Who accepts it?
- Any quantifiable or objectively checkable criteria?
- What is the delivery form? (file format, location, quantity)
- What is the difference between "done" and "done well"?

Quality bar: a third party unfamiliar with the task could judge completion using it alone.

## Output Template

Produce a file named `brief.md` (or named after the task, e.g., `brief-<task-name>.md`), strictly following this structure. Each element's body must respect the 255-character limit.

**Format rule: a brief is for scanning, not reading. All sections use point form (labeled bullets, tables, checklists) — except Goal, whose core must be ONE complete sentence.** A fragmented goal reintroduces the ambiguity this skill exists to remove.

```markdown
# Task Brief: [Task Name]

> Created: YYYY-MM-DD
> Status: Confirmed / Draft

## 1. Goal

[ONE complete sentence: for whom, doing what, achieving what effect]
- [optional supplementary point]
- [optional supplementary point]

## 2. Background

- **Trigger:** [why now]
- **History:** [prior attempts and why they failed, if any]
- **Fixed premises:** [decisions that must not be overturned]

## 3. Material

| Material | Purpose | Authority / Notes |
|----------|---------|-------------------|

## 4. Boundary

**Out of scope:**
- ...

**Hard constraints:**
- ...

## 5. Definition of Done

- [ ] [Acceptance conditions, itemized]

## Appendix: Open Items

[Every item the user skipped or that was filled by assumption — record each assumption verbatim]
```

The "Appendix: Open Items" section must faithfully record every gap filled by assumption — it is the first place to check when the brief later turns out to be wrong.

## Conduct Rules

- One element per round. Never dump questions for all five elements at once.
- Being corrected on an inference is normal flow — fix it and move on, no apology cascades.
- "Clear enough" means clear enough. Quality-bar warnings happen at most once per element.
- The guided dialogue follows the language of the user's input. (This document is in English; the conversation need not be.)
- The output of this skill is the brief, not the task result. Unless the user explicitly says otherwise, stop after the brief is confirmed and wait for instruction before executing.

## Example (excerpt)

User input: "Help me put together a system user manual for a client."

Pre-scan:
- Goal: `inferred` — enable the client to operate the system unaided, reducing support tickets?
- Background: `missing`
- Material: `missing`
- Boundary: `missing`
- DoD: `inferred` — a manual document, format unknown

Goal-round questions (illustrative):
1. What effect should this manual primarily achieve?
   Inference: I assume it's to let the client resolve common operations themselves, reducing support requests.
   Options: (a) reduce support tickets (b) contractual deliverable — passing acceptance is enough (c) sales/presentation use (d) other: ____
2. Who is the reader?
   Inference: day-to-day operators on the client side, non-technical.
   Options: (a) general operators (b) the client's IT admins (c) both (d) other: ____
