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
　Stay at system altitude: a screen, a field or a report column is one line under its §4
　capability; that module's plan holds the rest.
　
　The file stays here after the bootstrap: each module's MODULE.md points back to the capabilities
　it owns, and their acceptance checks, data and System Design are read from this file.
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

## 9. System Design
<!-- The system-level HOW, designed inside the fixed stack of project-memory/stack-architecture.md.
     Anything that deviates from or adds to the architecture doc is flagged **delta** where it
     appears. -->

### 9.1 Context
<!-- The system as one box, its actors (§2) and external systems (§6) around it, each arrow named
     with what crosses it. A Mermaid flowchart. -->
(TBD)

### 9.2 Modules and data ownership
<!-- Per module: the §4 capabilities it owns · the §5 data it owns, one owner per entity · the
     modules it depends on. -->
- (TBD)

### 9.3 Entry points and jobs
<!-- Per capability, the entry point that serves it — a page, an endpoint for outside callers, a
     scheduled or background job with its trigger — as the architecture doc defines them. -->
- (TBD)

### 9.4 Quality requirements
<!-- Only what this system needs beyond the architecture doc: volume, response time, concurrent
     users, roles and permissions, audit, availability windows, retention — each with the manual
     check that proves it. -->
- (TBD)

### 9.5 Shared mechanisms
<!-- Rules every module follows: sign-in and permissions, error handling and who receives alerts,
     transaction boundaries, the audit trail. -->
- (TBD)

## 10. Implementation Decisions
<!-- One line per choice settled while designing §9: decision · why · options ruled out. Schema
     changes, API contracts and interfaces between modules belong here too. -->
- (TBD)
