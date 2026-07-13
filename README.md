# workflow-memory-claude — Reusable Claude Code Memory Framework

A drop-in memory + workflow framework for developing any project with Claude Code.
Copy it into a project, swap one file, and Claude gains layered long-term memory and a
consistent development workflow.

## Core idea

**`CLAUDE.md` is a directory / router, not a warehouse.** It is auto-loaded every turn, so it
stays lean and points to detail that loads on demand. Memory is layered so the "always-on"
part stays small and depth is read only when needed.

Only one file changes per project: **`.claude/workspace-project-stack-architecture.md`** (the stack,
architecture, and hard constraints). Everything else is reusable as-is.

## Layout

```
CLAUDE.md                              Layer 1 index (auto-loaded) + @imports
.claude/
├── workspace-project-stack-architecture.md      ← the ONE per-project file (stack / architecture SSOT)
├── overview/
│   ├── system-overview-spec.md         system-level functional WHAT (one per system; read on demand)
│   └── references/                     system-wide reference material you provide (docs/images/links)
├── rules/                             behavioral rules, all @imported (always-on)
│   ├── workspace-workflow.md          the 3-step development workflow
│   ├── workspace-tech-mentor.md       technical mentorship style
│   ├── workspace-reduce-coding-mistake.md  guardrails against common LLM mistakes
│   ├── workspace-plan.impl.md         auto-save plan / impl at milestones
│   └── workspace-update-memory.md     Step 3: wrap-up memory update
├── skills/                            project-bound skills (travel WITH .claude/)
│   ├── workspace-system-overview-spec-generator/  spec → overview + scaffold modules (bound to the workflow)
│   └── workspace-spec-discuss/          no spec yet? discuss one into existence (system or module scope)
└── modules/<name>/                    one folder per module — its whole "brain"
    ├── MODULE.md                      rules, gotchas, boundaries (keep this exact name; tool-neutral)
    ├── specs/                         requirement specs you provide (multiple)
    ├── schema/                        .sql table schemas for CRUD
    ├── references/                    module reference material you provide (docs/images/links; read on demand)
    ├── <name>-flow.md                 handover map: flow + called files/methods (not change history)
    ├── plans/<name>-<date>-<slug>.md  pre-change plans (/workspace-task-brief, /workspace-grill-with-docs)
    └── impl/<name>-<date>-<slug>.md   post-change records (/save-implementation)
```

## Apply to a new project (3 steps)

1. Copy the whole `.claude/` folder **and** `CLAUDE.md` into the project.
2. Replace `.claude/workspace-project-stack-architecture.md` with that project's stack / architecture / constraints.
3. Clear `CLAUDE.md`'s "What this system is" and "Module Map" — fill them in as you work.

That's it for the framework files. The rules, the workflow, the module template, and all
project-bound skills in `.claude/skills/` come along unchanged — the framework is fully
self-contained (see **Skill dependencies** below).

## Daily workflow (3 steps)

Defined in `.claude/rules/workspace-workflow.md` (always-on):

1. **Requirement in** — bring the requirement (full spec / stated directly, optionally naming the module + files / clear goal worth challenging via `/workspace-grill-with-docs` / or discuss via `/workspace-task-brief`). Claude extracts what + why and identifies the target module + state.
2. **Core loop** — branch by module state (A existing / B legacy / C new) → code → build → test → save on every change.
3. **Wrap up** — update memory per `workspace-update-memory.md` (impl record, gotchas, plan, index).

## Portable vs per-project

| Layer | Files | Per project? |
|-------|-------|--------------|
| Framework (copy as-is) | `rules/workspace-*.md`, `modules/example-module/` template, `CLAUDE.md` skeleton | unchanged |
| The one config | `.claude/workspace-project-stack-architecture.md` | swap each project |
| Grows as you work | `CLAUDE.md` system description + module map, real module folders | filled per project |

## Notes

- All `workspace-*.md` rules are `@import`ed from `CLAUDE.md`, so they apply every turn (token cost — keep them tight).
- `workspace-project-stack-architecture.md` is `@import`ed too: hard constraints stay always-on so Claude never suggests off-stack code.
## Skill dependencies (important when copying)

All skills the workflow invokes are **project-bound** — they live in `.claude/skills/` and travel
with the folder: `workspace-system-overview-spec-generator`, `workspace-save-implementation`,
`workspace-task-brief`, `workspace-grill-with-docs`, `workspace-spec-discuss`,
`workspace-code-trace-spec`. No user-level (global) skill is required:
copying `.claude/` + `CLAUDE.md` brings the whole framework along.

> `workspace-save-implementation` is this project's replacement for the generic global `save-implementation`:
> it saves impl records to the module's `impl/` folder using this project's path convention **and** lightweight-syncs
> `<name>-flow.md`. Use it instead of `/save-implementation` here.
```
