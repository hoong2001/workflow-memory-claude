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
| Example module | Scaffold template every new module is copied from — keep it | `project-memory/modules/example-module/` | `MODULE.md` + `example-module-flow.md` |

<!-- A module folder's standard layout: the header comment of project-memory/modules/example-module/MODULE.md. -->

## Global Hard Rules
<!-- Project-specific hard constraints. Auto-loaded from the single per-project file below,
     so this section stays generic — the file changes per project, this section never does. -->
@project-memory/stack-architecture.md

## Common Entry Points
- Starting or resuming module work in a new conversation → open BOTH `project-memory/modules/<name>/MODULE.md` (rules + gotchas) and `project-memory/modules/<name>/<name>-flow.md` (how it works now). Two files, every time. Nothing under `project-memory/modules/` is auto-loaded.
- What is live across all modules → `project-memory/project-memory-status.md` — every plan not `Done`, in one table (Done plans are left out), rebuilt by a hook (`.claude/hooks/project-memory-status.mjs`); never edit it, the plans are the source.
- One-off work that changes no module → workflow Branch D (`/wp-task-record`)
- Files several modules lean on but none owns → `project-memory/docs/` (committed, read on demand)
- Skills map (order · when to use · purpose · output) → `.claude/skills/README.md`
- System overview & spec (functional WHAT) → `project-memory/overview/system-overview-spec.md`
- Stack / architecture (SSOT, technical HOW) → `project-memory/stack-architecture.md`
- Behavioral rules → `.claude/rules/` — each loads at launch, except the path-scoped `workspace-update-memory.md` (Step 3 wrap-up), `workspace-doc-writing-style.md`, and `workspace-sql-house-style.md` (`.sql` files), which load when a matching file is read or written
- Template sync whitelist (master → project updates) → `SYNC-MANIFEST.md`
- Hooks (credential guard, connection-string check, plan-status rebuild, template-update check, idea-interview hint) → `.claude/hooks/`, wired in `.claude/settings.json`; each file's header says what it does

## Behavioral Rules (auto-applied every turn)
<!-- Index only: every .claude/rules/*.md without `paths:` frontmatter loads at launch whether or not
     it is listed here, so deleting a line disables nothing — to disable a rule, move it out of
     .claude/rules/. Never list the path-scoped rules (workspace-update-memory.md,
     workspace-doc-writing-style.md, workspace-sql-house-style.md): an @import loads at launch and
     undoes their scoping. -->
@.claude/rules/workspace-workflow.md
@.claude/rules/workspace-doc-relative-paths.md
@.claude/rules/workspace-no-secrets.md
@.claude/rules/workspace-tech-mentor.md
@.claude/rules/workspace-reduce-coding-mistake.md
@.claude/rules/workspace-library-docs-first.md
@.claude/rules/workspace-plan-impl.md
@.claude/rules/workspace-template-sync.md

<!--
　Advanced: the @import syntax
　Writing "@ + path" in this file pulls another file in PERMANENTLY (every turn).
　Remember "permanently" — only use it for files needed every turn. Don't over-mount.
-->
