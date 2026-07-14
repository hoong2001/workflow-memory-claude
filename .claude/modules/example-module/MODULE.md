# Module: Example Module (example-module)

<!--
══════════════════════════════════════════════════════════════════
　Layer 2 · module memory. Copy the whole folder to start a new module (e.g. `.claude/modules/sems/`) and rename.
　A module's whole brain lives in its own folder — switching module = switching a complete context.
　
　Standard file structure (every module looks like this):
　  .claude/modules/<name>/
　  ├── MODULE.md                      ← this file. KEEP this exact name — do NOT prefix it (tool-neutral; the workflow reads it by this fixed filename)
　  ├── specs/                         ← requirement specs YOU provide (keep original filenames)
　  ├── schema/                        ← .sql table schemas this module does CRUD on (YOU provide)
　  ├── references/                    ← reference material YOU provide: docs, images, links (read on demand)
　  ├── <name>-flow.md                 ← handover map: module flow + called files/methods + short notes (NOT change history)
　  ├── plans/<name>-<date>-<slug>.md  ← pre-change plans (produced by /workspace-task-brief or /workspace-grill-with-docs)
　  └── impl/<name>-<date>-<slug>.md   ← post-change records (produced by /workspace-save-implementation, which also syncs <name>-flow.md)
　
　Source material (specs/, schema/, references/) is YOUR input; flow/plans/impl are what Claude derives.
　Naming: generated docs are prefixed with the module name for readability across editor tabs —
　        e.g. sems-flow.md, sems-2026-06-25-add-login.md. A change's plan and impl share the same name.
　        EXCEPTION: MODULE.md keeps its exact name (tool-neutral — works the same under Claude Code, Codex, or any agent; the workflow locates module memory by this fixed filename).
　
　Keep MODULE.md lean (rules first); specs / schema / flow / plans / impl are read on demand.
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
1. Unfamiliar code → `/workspace-code-trace-spec` → update `<name>-flow.md`, figure out where to cut.
2. Before acting → `/workspace-task-brief` (fuzzy requirement) or `/workspace-grill-with-docs` (clear goal) → save the plan to `plans/<name>-<date>-<slug>.md`.
   Need the technical cut nailed down before coding? → `/workspace-brief-to-technical-design` (appends "Technical Design" to the same plan file).
3. After done → `/workspace-save-implementation` → save the record to `impl/<name>-<date>-<slug>.md` AND sync `<name>-flow.md`.
4. If new rules or gotchas emerged → backfill the lists above in this file.
