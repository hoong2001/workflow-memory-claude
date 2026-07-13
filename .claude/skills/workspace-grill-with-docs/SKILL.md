---
name: workspace-grill-with-docs
description: Grilling session that stress-tests a plan against the module's documented rules (MODULE.md, flow, impl records) and the real code, sharpens terminology, and lands the crystallised plan in the module's plans/ folder. Use when the goal is already clear enough that the five-element /workspace-task-brief interview would be overkill, but the plan still deserves challenge before acting. Alternative route to produce plans/<name>-<date>-<slug>.md — same output location and naming as /workspace-task-brief.
---

<what-to-do>

Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one.

Each question follows a two-step pattern:

1. **Infer first** — state your recommended answer up front, with the reasoning behind it (from the docs, the code, or the constraints). Let me simply accept it.
2. **Options on rejection** — if I reject or doubt the inference, immediately present **3 concrete alternative options plus 1 free-form custom choice** (when the AskUserQuestion tool is available, use it — put your recommendation first with "(Recommended)"; its built-in "Other" serves as the custom choice). Each option must be a real, distinct direction with a one-line trade-off — never filler to pad the count.

Ask the questions one at a time, waiting for feedback on each question before continuing.

If a question can be answered by exploring the codebase, explore the codebase instead.

When the plan has crystallised, save it to the module's `plans/` folder (see "Wrap up" below).

</what-to-do>

<supporting-info>

## Domain awareness

This project keeps its domain knowledge in the layered module memory, NOT in CONTEXT.md or ADRs. During codebase exploration, also read the target module's docs:

```
.claude/modules/<name>/
├── MODULE.md          ← local conventions + known gotchas (the module's "glossary" and rules)
├── <name>-flow.md     ← how the module works now: flow + called files/methods
├── specs/             ← requirement specs the user provided
└── impl/              ← past change records (decision + why)
```

Also honour the always-on hard rules in `.claude/workspace-project-stack-architecture.md` — a plan that violates the stack constraints is dead on arrival; challenge it immediately.

## During the session

### Challenge against the module docs

When the user's plan or wording conflicts with MODULE.md's local conventions, known gotchas, or a decision recorded in `impl/`, call it out immediately. "MODULE.md says times here are UTC, but your plan formats them in the repository layer — which is it?"

### Sharpen fuzzy language

When the user uses vague or overloaded terms, propose a precise canonical term. "You're saying 'account' — do you mean the Customer or the User? Those are different things."

### Discuss concrete scenarios

When domain relationships are being discussed, stress-test them with specific scenarios. Invent scenarios that probe edge cases and force the user to be precise about the boundaries between concepts.

### Cross-reference with code

When the user states how something works, check whether the code (and `<name>-flow.md`) agrees. If you find a contradiction, surface it: "Your code cancels entire Orders, but you just said partial cancellation is possible — which is right?"

### Update MODULE.md inline

When a term, convention, or trap is resolved, update the target module's MODULE.md right there — don't batch these up:

- Resolved terminology / conventions → the **Local conventions** list.
- Newly discovered traps → the **Known gotchas** list.

Keep entries one line each. MODULE.md stays lean — rules and traps only, never implementation detail or change history.

### Record decisions in the plan, not ADRs

This framework has no ADR layer. A decision worth remembering — hard to reverse, surprising without context, the result of a real trade-off — goes into the plan document as **decision + why**. It will be carried into the paired `impl/` record by `/workspace-save-implementation` at wrap-up.

## Wrap up — save the plan

When the grilling converges, write the crystallised plan to:

```
.claude/modules/<name>/plans/<name>-<date>-<slug>.md
```

Same naming as `/workspace-task-brief` output, so it pairs with the same-named `impl/` record later. The plan must cover: the goal, the decisions made + why, where to cut (files/methods), and the definition of done if one emerged. Use project-root-relative paths only (see `workspace-doc-relative-paths.md`).

</supporting-info>
