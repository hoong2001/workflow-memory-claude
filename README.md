# workflow-memory-claude — Reusable Claude Code Memory Framework

A drop-in memory + workflow framework for developing any project with Claude Code.
Copy it into a project, swap one file, and Claude gains layered long-term memory and a
consistent development workflow.

## Core idea

**`CLAUDE.md` is a directory / router, not a warehouse.** It is auto-loaded every turn, so it
stays lean and points to detail that loads on demand. Memory is layered so the "always-on"
part stays small and depth is read only when needed.

Only one file is swapped per project: **`.claude/workspace-project-stack-architecture.md`** (the stack,
architecture, and hard constraints). `CLAUDE.md`'s system description and Module Map then grow as
you work; everything else is reusable as-is.

## Layout

```
CLAUDE.md                              Layer 1 index (auto-loaded) + @imports
.claude/
├── workspace-project-stack-architecture.md      ← the ONE per-project file (stack / architecture SSOT)
├── overview/
│   ├── system-overview-spec.md         system-level functional WHAT (one per system; read on demand)
│   └── references/                     system-wide reference material you provide (docs/images/links)
├── rules/                             behavioral rules (@imported = always-on)
│   ├── workspace-workflow.md          the 3-step development workflow
│   ├── workspace-tech-mentor.md       technical mentorship style
│   ├── workspace-reduce-coding-mistake.md  guardrails against common LLM mistakes
│   ├── workspace-library-docs-first.md  look up library docs (context7 MCP) before use — never guess an API
│   ├── workspace-plan.impl.md         plan / impl documentation triggers
│   ├── workspace-doc-relative-paths.md  no absolute paths in docs
│   ├── workspace-template-sync.md     never blind-overwrite project state on sync
│   └── workspace-update-memory.md     Step 3: wrap-up memory update (read on demand, NOT @imported)
├── skills/                            project-bound skills (travel WITH .claude/)
│   ├── workspace-system-spec-discuss/   no system spec yet? discuss one into existence (system scope only)
│   ├── workspace-system-overview-spec-generator/  spec → overview + scaffold modules (bound to the workflow)
│   ├── workspace-module-plan-discuss/   talk a module goal into a work-ready plan (gap detection scales depth)
│   ├── workspace-module-technical-design/  append "Technical Design" to the SAME plan file
│   ├── workspace-module-code-trace-flow/  legacy code → extract <name>-flow.md
│   ├── workspace-module-save-implementation/  save impl record + sync flow (user-triggered)
│   ├── workspace-auto-test-loop/     build → fix → CRUD-SQL verify → web-test (user-invoked; invocation = build/test authority)
│   ├── workspace-aspnet-mvc-frontend-standards/  frontend coding standards (SSOT)
│   ├── workspace-concrete-repository-pattern/  data-layer pattern (SSOT)
│   └── workspace-update-from-master/  pull template updates per SYNC-MANIFEST.md
└── modules/<name>/                    one folder per module — its whole "brain"
    ├── MODULE.md                      rules, gotchas, boundaries (keep this exact name; tool-neutral)
    ├── schema/                        .sql table schemas for CRUD (+ test/ — test scripts saved by auto-test-loop)
    ├── references/                    source material you provide (requirement docs/images/links; read on demand)
    ├── <name>-flow.md                 handover map: flow + called files/methods (not change history)
    ├── plans/<name>-<date>-<slug>.md  pre-change plans (/workspace-module-plan-discuss; /workspace-module-technical-design appends the design)
    └── impl/<name>-<date>-<slug>.md   post-change records (/workspace-module-save-implementation)
```

## Apply to a new project (3 steps)

1. Copy the whole `.claude/` folder, `CLAUDE.md`, **and `SYNC-MANIFEST.md`** into the project.
2. Replace `.claude/workspace-project-stack-architecture.md` with that project's stack / architecture / constraints,
   and set its **§0 Adoption Mode**. For an existing system, run the conformance scan defined
   there first — fully conformant keeps the file as-is (`brownfield-conformant`); any deviation
   is reported as a list for the user to rule on (amend the file vs. record as module debt).
3. Clear `CLAUDE.md`'s "What this system is" and "Module Map" — fill them in as you work.

That's it for the framework files. The rules, the workflow, the module template, and all
project-bound skills in `.claude/skills/` come along unchanged — the framework is fully
self-contained (see **Skill dependencies** below).

## Daily workflow (3 steps)

Defined in `.claude/rules/workspace-workflow.md` (always-on):

1. **Requirement in** — bring the requirement (full spec / stated directly, optionally naming the module + files / or any goal, clear or fuzzy, via `/workspace-module-plan-discuss` — its gap detection scales the discussion depth). Claude extracts what + why and identifies the target module + state.
2. **Core loop** — branch by module state (A existing / B legacy / C new) → code → build → test (build + test are run manually by the user; Claude reminds and fixes from reported results) → save on every change.
3. **Wrap up** — update memory per `workspace-update-memory.md` (impl record, gotchas, plan, index).

## Portable vs per-project

| Layer | Files | Per project? |
|-------|-------|--------------|
| Framework (copy as-is) | `rules/workspace-*.md`, `skills/workspace-*`, `modules/example-module/` template, `CLAUDE.md` skeleton, `SYNC-MANIFEST.md` | unchanged |
| The one config | `.claude/workspace-project-stack-architecture.md` | swap each project |
| Grows as you work | `CLAUDE.md` system description + module map, real module folders | filled per project |

## Notes

- Rules are `@import`ed from `CLAUDE.md`, so they apply every turn (token cost — keep them tight). Exception: `workspace-update-memory.md` is read on demand at task wrap-up, not imported.
- `workspace-project-stack-architecture.md` is `@import`ed too: hard constraints stay always-on so Claude never suggests off-stack code.
## Skill dependencies (important when copying)

All skills the workflow invokes are **project-bound** — they live in `.claude/skills/` and travel
with the folder: `workspace-system-overview-spec-generator`, `workspace-module-save-implementation`,
`workspace-module-plan-discuss`, `workspace-module-technical-design` (which in turn follows the
stack-bound `workspace-concrete-repository-pattern` + `workspace-aspnet-mvc-frontend-standards`),
`workspace-system-spec-discuss`, `workspace-module-code-trace-flow`, `workspace-auto-test-loop`,
and `workspace-update-from-master`. No user-level (global) skill is required:
copying the framework files (adoption step 1) brings everything along.

> `workspace-module-save-implementation` is this project's replacement for the generic global `save-implementation`:
> it saves impl records to the module's `impl/` folder using this project's path convention **and** lightweight-syncs
> `<name>-flow.md`. Use it instead of `/save-implementation` here.
