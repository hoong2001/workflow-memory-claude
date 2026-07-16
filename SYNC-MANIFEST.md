# SYNC-MANIFEST — Template Sync Whitelist

> This workspace is the **master copy** of a workflow convention, copied into different
> projects. When pushing template updates to a project already in use, copy ONLY the
> paths listed under "Safe to overwrite". Everything else belongs to the target project.

## ✅ Safe to overwrite (pure template logic — sync freely)

| Path | What it is |
|---|---|
| `.claude/rules/` | Behavioral rules (whole folder) |
| `.claude/skills/` | Workflow skills (whole folder) |
| `.claude/modules/example-module/` | Module scaffold template |
| `SYNC-MANIFEST.md` | This manifest itself |

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

## Sync procedure

> Preferred: run `/workspace-update-from-master` in the target project — it executes
> the steps below with a master-path confirmation prompt and a dry-run report.
> The manual steps:

1. Copy the ✅ paths from master into the target project, overwriting.
2. Diff the ⚠️ files; hand-merge template-side changes only.
3. Never touch the 🚫 paths.
4. If the master added a new rule file, remember to add its `@import` line to the
   target's `CLAUDE.md` (step 2 covers this).
