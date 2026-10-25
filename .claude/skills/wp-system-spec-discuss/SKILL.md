---
name: wp-system-spec-discuss
description: Discuss a whole-system spec into existence → project-memory/overview/references/.
disable-model-invocation: true
---

<what-to-do>

Drive a structured discussion that converges on a written whole-system spec — the WHAT of the system, precise enough for the bootstrap (or a future session) to build from without asking you again. This skill is system-scope only: a single module/feature requirement is talked straight into a work doc in `plans/` via `/wp-module-plan-discuss`, never into a spec.

**Purpose gate** — `.claude/skills/_shared-conventions.md`; the purpose it yields seeds §1 Purpose.

**Interview:** one question at a time, each answer in before the next; read the code and docs before
spending a question they answer. Choices follow the **Question pattern** in
`.claude/skills/_shared-conventions.md`.

**Synthesize before you interview.** If the conversation that led here, or an interview record (**Interview record as input** in `.claude/skills/_shared-conventions.md`), has already settled a section, do NOT re-ask it — synthesize what was discussed into that section and present it for a one-line confirmation. Interview only the genuine gaps. A spec growing out of a long working conversation may need no interview at all, just synthesis.

</what-to-do>

<supporting-info>

## Step 0a — Read the stack constraints FIRST

`project-memory/stack-architecture.md` (in context through `CLAUDE.md`) is the
single source of truth for the stack, the layering, and the forbidden patterns. Every inference you
offer and every option you present must already respect it — never propose a capability that quietly
assumes tech the doc's forbidden-patterns section rules out (in some stacks that might be async
jobs, an ORM, or a SPA framework), and challenge me immediately if my own wording does.

**If the file is missing or still a placeholder** (framework freshly copied, or the stack genuinely
undecided): say so explicitly, then continue — do NOT block, and do NOT silently pretend constraints
exist. The technical pass (System Design) flips role: instead of checking against constraints, it
*produces candidate stack decisions* (each with a one-line why). At wrap-up, recommend seeding
`stack-architecture.md` from them — but never create or edit that file yourself;
the architecture doc is always the user's to write (same rule as the generator's tech
reconciliation).

## Step 0b — Confirm the scope is the whole system

This skill produces exactly one kind of output: a whole-system spec at
`project-memory/overview/references/spec-<date>-<slug>.md`, ready for the bootstrap.

If what the user actually describes is a single module/feature requirement, STOP and route to
`/wp-module-plan-discuss` — module-level requirements are talked straight into a work doc
in `plans/`, never into a spec.

## Step 1 — Gather seed material

A spec rarely starts from nothing. Before questioning, read what already exists:

- `project-memory/overview/system-overview-spec.md` (if partially filled) and `project-memory/overview/references/`.
- Any existing module docs (`MODULE.md`, `<name>-flow.md`) if parts of the system are already built.

## Step 2 — Discuss, section by section, as the system's architect

The spec's sections, their order, and what goes in each are `.claude/skills/_system-spec-template.md`
— read it now and discuss its sections in that order.

**Hold the system altitude** the template's header sets: a screen or field the user raises is
recorded the way it says, and the discussion carries on at system level.

**Lead with a design.** For each System Design subsection, put forward a draft inferred from §1–§8
and the architecture doc read in Step 0a, and ask the user to challenge it through the Question
pattern, the draft as its recommended option. A choice that needs something outside the stack and
forbidden-pattern rules (a new library, an external API) is named as a **delta** — never smuggled in.
Each settled choice lands in Implementation Decisions.

- **Acceptance Checks** — confirm each check matches the user's expectations.

The spec is done when every section the template marks (required) is filled and every other one is
filled or `(TBD — <what is still needed>)`.

## Step 3 — Write and hand off

Write the spec as a filled copy of the template, headings and comments kept, to
`project-memory/overview/references/spec-<date>-<slug>.md`. Then tell the user the spec is ready, and tell them to run `/wp-system-overview-spec-generator` on it to execute the bootstrap. Say it as the handoff (the **Handoff** section of `.claude/skills/_shared-conventions.md`): Done = the spec path; You now = read the spec once end to end; Next = the user runs `/wp-system-overview-spec-generator` on that file.

</supporting-info>
