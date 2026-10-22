# Module: Example Module (example-module)

<!--
══════════════════════════════════════════════════════════════════
　Layer 2 · module memory. Copy the whole folder to start a new module (e.g. `project-memory/modules/orders/`) and rename.
　A module's whole brain lives in its own folder — switching module = switching a complete context.
　
　Standard file structure (every module looks like this):
　  project-memory/modules/<name>/
　  ├── MODULE.md                      ← this file
　  ├── schema/                        ← EVERY .sql this module owns: tables/views/indexes (you provide) + seed scripts (generated). See schema/_README.md
　  ├── references/                    ← source material YOU provide: requirement docs, images, links (read on demand)
　  ├── <name>-flow.md                 ← handover map: module flow + Mermaid diagram + called files/methods + short notes
　  ├── diagrams/                      ← optional archify HTML diagrams for people, made only when you say yes (created on first use)
　  ├── plans/<name>-<date>-<slug>.md  ← pre-change plans (produced by /wp-module-plan-discuss)
　  └── impl/<name>-<date>-<slug>.md   ← post-change records (produced by /wp-module-save-implementation, which also syncs <name>-flow.md)
　
　references/ is YOUR input. schema/ is mixed: you provide tables/views/indexes, Claude adds seed scripts — origin is readable from the filename, see schema/_README.md. flow/plans/impl are what Claude derives.
　plans/ holds the work docs — requirements are talked into a work-ready plan there (no separate specs/ folder).
　Naming: generated docs are prefixed with the module name for readability across editor tabs —
　        e.g. orders-flow.md, orders-2026-06-25-add-login.md. A change's plan and impl share the same name.
　        EXCEPTION: MODULE.md keeps its exact name (tool-neutral — works the same under Claude Code, Codex, or any agent; the workflow locates module memory by this fixed filename).
　
　Keep MODULE.md lean (rules first); schema / references / flow / plans / impl are read on demand.
══════════════════════════════════════════════════════════════════
-->

## What this module does
(One or two lines. What it owns, where its boundary is.)

## Local conventions (must follow when working in this module)
- (e.g.) All public functions return a Result type — never throw directly.
-

## Known gotchas / easy traps
- (e.g.) Times here are UTC; convert to timezone only at the display layer. Confirm before changing.
-

## Public interface / dependencies
- Exposed to:
- Depends on which modules:

## Standard workflow
Changing this module follows `.claude/rules/workspace-workflow.md` Step 2 (Branch A starts by reading this file and `<name>-flow.md`).
