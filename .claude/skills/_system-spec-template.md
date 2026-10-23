# System Spec — <System Name>

<!--
══════════════════════════════════════════════════════════════════
　Whole-system spec · the input to /wp-system-overview-spec-generator (the bootstrap).
　Saved as project-memory/overview/references/spec-<YYYY-MM-DD>-<slug>.md: copy this template
　(.claude/skills/_system-spec-template.md) and fill it in, or let /wp-system-spec-discuss write it.
　
　Sections marked (required) are filled before the bootstrap runs. Every other section is filled
　or left as (TBD — <what is still needed>).
　
　§1–§8 are the WHAT. Technical matter is collected in §9–§10, never scattered through the WHAT.
　Name modules and interfaces, never source-file paths or code snippets — they go stale fast.
　Exception: a snippet that states a decision more precisely than prose (a state machine, a
　schema, a type shape) may be inlined in its section, trimmed to the decision-rich parts.
　
　The file stays here after the bootstrap: each module's MODULE.md points back to the capabilities
　it owns, and their acceptance checks and data are read from this file.
══════════════════════════════════════════════════════════════════
-->

## 1. Purpose (required)
<!-- What problem this solves and for whom. One paragraph. -->
(TBD)

## 2. Actors
<!-- Who uses it and in what role: human roles, calling systems, operators. -->
- (TBD)

## 3. Scope (required)
<!-- Out of scope is as valuable as in scope: it is what stops a module from growing past its job. -->
- **In scope:** (TBD)
- **Out of scope:** (TBD)

## 4. Capabilities (required)
<!-- Numbered; one verifiable statement each. Where naming the actor and benefit adds clarity, write a
     user story: "As an <actor>, I want <feature>, so that <benefit>". §7 and each module's MODULE.md
     refer to capabilities by these numbers. -->
1. (TBD)

## 5. Data
<!-- The entities and their key relationships. Concrete tables → their .sql goes to the owning
     module's schema/ once the modules are scaffolded. -->
- (TBD)

## 6. External Integrations
<!-- The external systems, APIs, file feeds and notifications the system talks to, and why.
     How each one is called belongs in §9. -->
- (TBD)

## 7. Acceptance Checks
<!-- Testing is manual: Claude builds, the user tests. Per capability (by its §4 number), the check the
     user runs by hand: the screen or output opened, the input tried, the result expected.
     External behaviour only, never implementation detail. -->
- Capability 1: (TBD)

## 8. Domain Glossary
<!-- Domain terms a new reader needs, each as `term — meaning`. -->
- term — meaning

## 9. Technical Considerations
<!-- A pass over §4 against project-memory/stack-architecture.md, per capability: feasibility on this
     stack, layer placement (and sharing across entry points), integration points, performance and
     volume traits. Anything that deviates from or adds to the architecture doc is flagged **delta**. -->
- (TBD)

## 10. Implementation Decisions
<!-- What was decided, as a list: modules to build or modify and their interfaces, architectural
     decisions, schema changes, API contracts, specific interactions. §9 surfaces the questions;
     this section records the answers. -->
- (TBD)
