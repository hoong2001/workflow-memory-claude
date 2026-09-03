# workflow-memory-claude — Project Memory Index (a directory, not a warehouse)

<!--
══════════════════════════════════════════════════════════════════
　NAME NOTE: "workflow-memory-claude" names this reusable workflow/memory framework —
　NOT the system being built. It stays the same in every project that adopts it; the actual
　project/system is described under "What this system is" below.
　
　Role of this file: directory / router. It tells Claude WHERE to look, not the details.
　Four hard rules:
　  1. Auto-loaded every turn → keep it lean. Skimmable in one screen.
　  2. Only four things belong here: ① what the system is ② module map ③ global hard rules ④ entry points.
　  3. Point to details (path links); never paste them in.
　  4. Once this file exceeds one screen, something should move to `project-memory/` (module
　     memory, overview, architecture) or `.claude/` (rules, skills).
══════════════════════════════════════════════════════════════════
-->

## What this system is
<!-- One or two lines describing THIS project (not the framework). Template: This system is a ___, for ___, solving ___.
     Keep it to a summary here; the full functional overview lives in the system spec linked below. -->
(TBD)

## Module Map
<!--
　Add one row per module. The 4th column lists BOTH deep docs, as filenames relative to the
　Location column: `MODULE.md` (rules + gotchas) AND `<name>-flow.md` (how it works now).
　A module hand-over needs both — never list only one. Plain paths — do NOT use @import.
　Reason: a module's deep docs only need reading when Claude works in that folder;
　        force-mounting it here would break the layering and waste tokens.
-->
| Module | One-line responsibility | Location | Deep docs (open BOTH) |
|---|---|---|---|
| Example module | Demo only, deletable | `project-memory/modules/example-module/` | `MODULE.md` + `example-module-flow.md` |

<!--
　Standard contents of each module folder (a module's whole brain lives in its own folder):
　  MODULE.md (rules/gotchas) · <name>-flow.md (call chain) · plans/ (pre-change plans) · impl/ (post-change records)
　Workflow: /wp-module-code-trace-flow→flow ; /wp-module-plan-discuss→plans (optionally deepened by /wp-module-technical-design) ; /wp-module-save-implementation→impl (also syncs flow)
　Full explanation: see the comment at the top of any module's MODULE.md.
-->

## Global Hard Rules
<!-- Project-specific hard constraints. Auto-loaded from the single per-project file below,
     so this section stays generic — only stack-architecture.md changes per project. -->
@project-memory/stack-architecture.md

## Common Entry Points
- Starting or resuming module work in a new conversation → open BOTH `project-memory/modules/<name>/MODULE.md` (rules + gotchas) and `project-memory/modules/<name>/<name>-flow.md` (how it works now). Two files, every time. Nothing under `project-memory/modules/` is auto-loaded.
- Skills map (order · when to use · purpose · output) → `.claude/skills/README.md`
- System overview & spec (functional WHAT) → `project-memory/overview/system-overview-spec.md`
- Stack / architecture (SSOT, technical HOW) → `project-memory/stack-architecture.md`
- Behavioral rules → `.claude/rules/` (auto-applied via @import below)
- Memory-update flow → `.claude/rules/workspace-update-memory.md` (read on demand at task wrap-up — see workflow Step 3)
- Template sync whitelist (master → project updates) → `SYNC-MANIFEST.md`

## Behavioral Rules (auto-applied every turn)
<!-- @import loads every turn → ongoing token cost. Only mount rules that must always be on;
     to temporarily disable one, comment out its line. This project uses .claude/rules/workspace-*.md.
     NOTE: workspace-update-memory.md is intentionally NOT mounted — it's a task-WRAP-UP procedure,
     read on demand at workflow Step 3 (no need to carry it every turn). -->
@.claude/rules/workspace-workflow.md
@.claude/rules/workspace-doc-relative-paths.md
@.claude/rules/workspace-tech-mentor.md
@.claude/rules/workspace-reduce-coding-mistake.md
@.claude/rules/workspace-library-docs-first.md
@.claude/rules/workspace-sql-house-style.md
@.claude/rules/workspace-plan-impl.md
@.claude/rules/workspace-template-sync.md

## About this memory system
Layered memory: this file (layer 1, auto-loaded, lean index) → module layer `project-memory/modules/<name>/`
(layer 2, read on demand — `MODULE.md` AND `<name>-flow.md`, always both) → governance layer per
Common Entry Points above (+ `.claude/skills/` project-bound skills).

<!--
　Advanced: the @import syntax
　Writing "@ + path" in this file pulls another file in PERMANENTLY (every turn).
　Remember "permanently" — only use it for files needed every turn. Don't over-mount.
-->
