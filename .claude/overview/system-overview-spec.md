# System Overview & Spec — <System Name>

<!--
══════════════════════════════════════════════════════════════════
　Governance layer · system-level memory. ONE per system.
　
　This file answers WHAT the system is and does (the functional whole-picture).
　It is NOT:
　  - HOW it is built        → .claude/workspace-project-stack-architecture.md (stack, layers, patterns)
　  - the module index       → root CLAUDE.md "Module Map"
　  - a single component's requirement → .claude/modules/<name>/specs/  (per-feature, many)
　
　A module is a COMPONENT (a part). This file is the WHOLE. Never put the system
　overview inside a module folder, and never put component-level detail here.
　
　Written when the system is born; updated when scope or capabilities shift.
　Read on demand (NOT @imported) — keep it the functional picture, point to detail.
══════════════════════════════════════════════════════════════════
-->

## 1. What this system is
<!-- Template: This system is a ___, for ___, solving ___. -->
(TBD)

## 2. Scope
- **In scope:** (TBD)
- **Out of scope:** (TBD)

## 3. Actors / Users
- (who uses it, and in what role)

## 4. Capability Map (what it does)
<!-- The major functional areas — the WHAT, not the HOW. One bullet per capability. -->
- (TBD)

## 5. Module Composition
<!-- How the capabilities above split into modules and fit together.
     §4 → §5 is the bridge that DRIVES module creation: each capability is grouped into a module,
     each module here becomes a .claude/modules/<name>/ folder.
     Procedure: workflow Step 1 "Brand-new system" (decompose → get sign-off → scaffold each via Step 2 Branch C).
     For the module index (names + paths) see root CLAUDE.md "Module Map" — do not duplicate it here. -->
- (TBD)

## 6. External Integrations
- (external systems, APIs, file feeds this system talks to)

## 7. Domain Glossary
<!-- Domain terms a new reader needs to understand the system. -->
- term — meaning
