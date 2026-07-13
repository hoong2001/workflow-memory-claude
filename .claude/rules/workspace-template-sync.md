# Template Sync Rule — Never Blind-Overwrite Project State

This workspace layout originates from a master template (`workflow-memory-claude`)
that is copied into different projects. Template updates flow master → project.

**Hard rule:** when applying a template update to a project already in use, NEVER
copy the whole `.claude/` tree or the whole repo over the target. Follow the
whitelist in `SYNC-MANIFEST.md` at the project root:

- ✅ Overwrite freely: `.claude/rules/`, `.claude/skills/`, `.claude/modules/example-module/`, `SYNC-MANIFEST.md`
- 🚫 Never overwrite: real module folders under `.claude/modules/`, `.claude/overview/`
- ⚠️ Manual merge only: root `CLAUDE.md`, `.claude/workspace-project-stack-architecture.md`

**Why:** real module folders (`plans/`, `impl/`, `specs/`, MODULE.md, flow docs) and
the system overview are the project's accumulated memory. A blind overwrite destroys
that progress permanently — there is no undo on a synced drive.

**How to apply:** before any sync/copy operation between the master and a project,
read `SYNC-MANIFEST.md` and execute its "Sync procedure" section step by step. If a
file doesn't clearly fall into a category, treat it as 🚫 and ask the user.
