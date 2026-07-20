---
name: workspace-system-spec-discuss
description: Discuss a WHOLE-SYSTEM spec into existence when none exists yet - it feeds /workspace-system-overview-spec-generator for the brand-new-system bootstrap and is saved to .claude/overview/references/. SYSTEM SCOPE ONLY. Use when the user wants to "discuss the system spec" or "write the system requirements doc together". Do NOT use for a single module/feature requirement (/workspace-module-plan-discuss), or when a reasonably complete spec already exists - hand that straight to the generator.
---

<what-to-do>

Drive a structured discussion that converges on a written whole-system spec — the WHAT of the system, precise enough for the bootstrap (or a future session) to build from without asking you again. This skill is system-scope only: a single module/feature requirement is talked straight into a work doc in `plans/` via `/workspace-module-plan-discuss`, never into a spec.

Each question follows the two-step pattern:

1. **Infer first** — state your recommended answer up front, with the reasoning behind it (from existing plans, module docs, the code, or the constraints). Let me simply accept it.
2. **Options on rejection** — if I reject or doubt the inference, immediately present **4 concrete alternative options plus 1 free-form custom choice** (when the AskUserQuestion tool is available, use it — put your recommendation first with "(Recommended)"; its built-in "Other" serves as the custom choice). Each option must be a real, distinct direction with a one-line trade-off — never filler to pad the count.

Ask the questions one at a time, waiting for feedback on each question before continuing.

If a question can be answered by exploring the codebase or existing docs, explore instead of asking.

**Synthesize before you interview.** If the conversation that led here has already settled a section, do NOT re-ask it — synthesize what was discussed into that section and present it for a one-line confirmation. Interview only the genuine gaps. A spec growing out of a long working conversation may need no interview at all, just synthesis.

</what-to-do>

<supporting-info>

## Step 0a — Read the stack constraints FIRST

Before the first question, read `.claude/workspace-project-stack-architecture.md` in full. It is the
single source of truth for the stack, the layering, and the forbidden patterns. Every inference you
offer and every option you present must already respect it — never propose a capability that quietly
assumes tech the doc's forbidden-patterns section rules out (in some stacks that might be async
jobs, an ORM, or a SPA framework), and challenge me immediately if my own wording does.

**If the file is missing or still a placeholder** (framework freshly copied, or the stack genuinely
undecided): say so explicitly, then continue — do NOT block, and do NOT silently pretend constraints
exist. The technical pass (section 6) flips role: instead of checking against constraints, it
*produces candidate stack decisions* (each with a one-line why). At wrap-up, recommend seeding
`workspace-project-stack-architecture.md` from them — but never create or edit that file yourself;
the architecture doc is always the user's to write (same rule as the generator's tech
reconciliation).

## Step 0b — Confirm the scope is the whole system

This skill produces exactly one kind of output: a whole-system spec at
`.claude/overview/references/spec-<date>-<slug>.md`, ready for the bootstrap.

If what the user actually describes is a single module/feature requirement, STOP and route to
`/workspace-module-plan-discuss` — module-level requirements are talked straight into a work doc
in `plans/`, never into a spec.

## Step 1 — Gather seed material

A spec rarely starts from nothing. Before questioning, read what already exists:

- `.claude/overview/system-overview-spec.md` (if partially filled) and `.claude/overview/references/`.
- Any existing module docs (`MODULE.md`, `<name>-flow.md`) if parts of the system are already built.

## Step 2 — Discuss, section by section

The spec body is the **WHAT** — capabilities, boundaries, data, and done-criteria. Technical matter is discussed too, but it is collected into its own sections (6–8), never scattered through the body. Cover, in order:

1. **Purpose** — what problem this solves and for whom. One paragraph.
2. **Capabilities** — what it must do, as a numbered list of verifiable statements. Where naming the actor and benefit adds clarity, write the statement as a user story: "As an <actor>, I want <feature>, so that <benefit>".
3. **Boundaries** — explicitly out of scope. As valuable as the capabilities list.
4. **Data** — the entities involved and their key relationships. If concrete tables emerge, note that their `.sql` schemas belong in the owning module's `schema/` folder once modules are scaffolded.
5. **Acceptance criteria** — how we will know each capability works.
6. **Technical considerations** — a deliberate technical pass over the finished capability list, grounded in the architecture doc read in Step 0a. For each capability, probe:
   - **Feasibility on this stack** — can it be built within the stack and forbidden-pattern rules? If a capability genuinely needs something outside them (a new library, a scheduled job, an external API), name it here explicitly — never smuggle it in.
   - **Layer placement** — which layer(s) it touches, per the architecture doc's layering, and any cross-entry-point sharing (e.g. used by both the web app and a background service?).
   - **Integration points** — external systems, file formats, notifications, existing modules it must talk to.
   - **Performance / volume traits** — data volumes, batch vs interactive, anything that shapes the design later.

   Anything that deviates from or adds to the architecture doc gets flagged as an explicit **delta** — this section is exactly what the generator's tech-reconciliation step consumes.

7. **Implementation decisions** — the concrete technical decisions settled during the discussion, as a list: modules to build or modify and their interfaces, architectural decisions, schema changes, API contracts, specific interactions, and technical clarifications from the user. Section 6 is the pass that *surfaces* the questions; this section records what was *decided*. Honour the spec durability rule (Step 3): name modules and interfaces, never source-file paths or code snippets.

8. **Testing decisions** — at which seams the feature will be tested: prefer existing seams over new ones, the highest seam possible, and as few as possible (the ideal number is one); confirm the chosen seams match the user's expectations. Plus what makes a good test here (external behavior only, never implementation details), which modules get tested, and prior art if similar tests already exist in the codebase.

The spec must be complete enough to pass the generator's own entry check: purpose, capability map, and data entities all present. Thin sections mean the bootstrap will bounce it back.

## Step 3 — Write and hand off

Write the spec to `.claude/overview/references/spec-<date>-<slug>.md`, using project-root-relative paths in the content (see `workspace-doc-relative-paths.md`). Then hand off:

**Spec durability rule:** the spec body is the WHAT — do not pin specific source-file paths or code snippets into it; they go stale fast. Name modules and interfaces instead (pointers to other `.claude/` docs are fine). Exception: a snippet that encodes a decision more precisely than prose can (a state machine, schema, type shape — often from a prototype) may be inlined in the relevant section, trimmed to the decision-rich parts.

Tell the user the spec is ready and recommend running `/workspace-system-overview-spec-generator` on it to execute the bootstrap.

</supporting-info>
