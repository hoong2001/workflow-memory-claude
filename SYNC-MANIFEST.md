# SYNC-MANIFEST — Template Sync Whitelist

> This workspace is the **master copy** of a workflow convention, copied into different
> projects. When pushing template updates to a project already in use, copy ONLY the
> paths listed under "Safe to overwrite". Everything else belongs to the target project.

## 📦 Master source (where `/workspace-update-from-master` pulls from)

Sync pulls the master by **git clone** — no machine-specific folder path to maintain.

| Setting | Value |
|---|---|
| Repo | `https://github.com/hoong2001/workflow-memory-claude.git` (public — anonymous clone) |
| Branch | `main` |

Override by editing this block, or by giving the skill a different URL/branch when it asks.
A **local master path** is the fallback only — for working offline or testing an unpushed
master; git is the default source.

## ✅ Safe to overwrite (pure template logic — sync freely)

| Path | What it is |
|---|---|
| `.claude/rules/` | Behavioral rules (whole folder) |
| `.claude/skills/` | Workflow skills (whole folder) |
| `.claude/modules/example-module/` | Module scaffold template |
| `SYNC-MANIFEST.md` | This manifest itself |

## 🏠 Master-only (never copied to projects)

Root `README.md`, `LICENSE`, `.gitignore` — they describe/govern the master repo itself.

## 🚫 Never overwrite (project state — overwriting loses progress permanently)

| Path | What it is |
|---|---|
| `.claude/modules/<any real module>/` | MODULE.md, schema/, plans/, impl/, references/, `<name>-flow.md` — the project's accumulated memory |
| `.claude/overview/system-overview-spec.md` | That system's functional spec |
| `.claude/overview/references/` | That system's reference materials |
| Root `CLAUDE.md` Module Map section | Project state (see grey zone below) |

## ⚠️ Grey zone (manual merge only — never mechanical copy)

| Path | Template part | Project part |
|---|---|---|
| Root `CLAUDE.md` | Structure + `@import` lines | Module Map rows, "What this system is" |
| `.claude/workspace-project-stack-architecture.md` | Default stack/architecture baseline | Any project-specific customization |

**Merge procedure for grey-zone files:** diff master vs. target, apply only the
template-side changes (e.g. a newly added `@import` line), keep all project-side
content untouched.

## 🗑️ Renames / deletions (obsolete template paths — remove from target after copy)

> Copying never removes files, so a renamed or merged template path lingers in the
> target — and a stale skill keeps auto-triggering alongside its replacement. This
> list is the ONLY deletion authority: sync may delete a target path ONLY if it
> appears here, and only after user confirmation. Nothing else is ever deleted.

| Obsolete path (delete in target) | Replaced by |
|---|---|
| `.claude/skills/workspace-spec-discuss/` | `.claude/skills/workspace-system-spec-discuss/` |
| `.claude/skills/workspace-brief-to-technical-design/` | `.claude/skills/workspace-module-technical-design/` |
| `.claude/skills/workspace-code-trace-spec/` | `.claude/skills/workspace-module-code-trace-flow/` |
| `.claude/skills/workspace-save-implementation/` | `.claude/skills/workspace-module-save-implementation/` |
| `.claude/skills/workspace-task-brief/` | merged into `.claude/skills/workspace-module-plan-discuss/` |
| `.claude/skills/workspace-grill-with-docs/` | merged into `.claude/skills/workspace-module-plan-discuss/` |
| `.claude/skills/workspace-asp.net-mvc-frontend-standards/` | `.claude/skills/workspace-aspnet-mvc-frontend-standards/` (renamed — skill names allow lowercase letters/digits/hyphens only) |
| `.claude/modules/example-module/specs/` | folder concept removed — material → `references/` (`.sql` → `schema/`), work docs → `plans/` |

> Scope: TEMPLATE paths only. A real module's `specs/` folder is project state (🚫) —
> its content is migrated by hand per the workflow routing rule, never deleted by sync.

## Sync procedure

> Preferred: run `/workspace-update-from-master` in the target project — it git-clones the
> master (per the Master source block above; local-path fallback on request) and executes
> the steps below with a dry-run report. The manual steps:

1. Copy the ✅ paths from master into the target project, overwriting.
2. Delete the 🗑️ paths from the target — ONLY those on the list above, only after the
   replacement has been copied in step 1, and only with user confirmation.
3. Diff the ⚠️ files; hand-merge template-side changes only.
4. Never touch the 🚫 paths.
5. If the master added a new rule file, remember to add its `@import` line to the
   target's `CLAUDE.md` (step 3 covers this).
6. Alignment scan: grep the target's LIVING docs (root `CLAUDE.md`, overview spec,
   each module's `MODULE.md` + `<name>-flow.md`) for the 🗑️ obsolete names; fix hits
   with user confirmation. Historical `plans/` / `impl/` / `references/` stay untouched —
   stale names there are history, not defects.
