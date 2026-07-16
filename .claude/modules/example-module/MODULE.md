# Module: Example Module (example-module)

<!--
══════════════════════════════════════════════════════════════════
　Layer 2 · module memory. Copy the whole folder to start a new module (e.g. `.claude/modules/sems/`) and rename.
　A module's whole brain lives in its own folder — switching module = switching a complete context.
　
　Standard file structure (every module looks like this):
　  .claude/modules/<name>/
　  ├── MODULE.md                      ← this file. KEEP this exact name — do NOT prefix it (tool-neutral; the workflow reads it by this fixed filename)
　  ├── schema/                        ← .sql table schemas this module does CRUD on (YOU provide)
　  ├── references/                    ← source material YOU provide: requirement docs, images, links (read on demand)
　  ├── <name>-flow.md                 ← handover map: module flow + called files/methods + short notes (NOT change history)
　  ├── plans/<name>-<date>-<slug>.md  ← pre-change plans (produced by /workspace-module-plan-discuss)
　  └── impl/<name>-<date>-<slug>.md   ← post-change records (produced by /workspace-module-save-implementation, which also syncs <name>-flow.md)
　
　Source material (schema/, references/) is YOUR input; flow/plans/impl are what Claude derives.
　plans/ holds the work docs — requirements are talked into a work-ready plan there (no separate specs/ folder).
　Naming: generated docs are prefixed with the module name for readability across editor tabs —
　        e.g. sems-flow.md, sems-2026-06-25-add-login.md. A change's plan and impl share the same name.
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

## Standard workflow (follow this when changing this module)
1. Unfamiliar code → `/workspace-module-code-trace-flow` → update `<name>-flow.md`, figure out where to cut.
2. Before acting → `/workspace-module-plan-discuss` (state the goal; gap detection scales the discussion depth) → save the plan to `plans/<name>-<date>-<slug>.md`.
   Need the technical cut nailed down before coding? → `/workspace-module-technical-design` (appends "Technical Design" to the same plan file).
3. After done → remind the user to run `/workspace-module-save-implementation` (never auto-run; their call) → it saves the record to `impl/<name>-<date>-<slug>.md` AND syncs `<name>-flow.md`.
4. If new rules or gotchas emerged → backfill the lists above in this file.
