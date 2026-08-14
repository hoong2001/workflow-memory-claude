# SYNC-MANIFEST — Template Sync Whitelist

> This workspace is the **master copy** of a workflow convention, copied into different
> projects. When pushing template updates to a project already in use, copy ONLY the
> paths listed under "Safe to overwrite". Everything else belongs to the target project.

## 📦 Master source (where `/wp-update-from-master` pulls from)

Sync pulls the master by **git clone** — no machine-specific folder path to maintain.

| Setting | Value |
|---|---|
| Repo | `https://github.com/hoong2001/workflow-memory-claude.git` (public — anonymous clone) |
| Branch | `main` |
| Version | `1.0.0` |

Override by editing this block, or by giving the skill a different URL/branch when it asks.
A **local master path** is the fallback only — for working offline or testing an unpushed
master; git is the default source.

> **Version policy** — bump on any commit that touches a ✅ path below (`.claude/rules/`,
> `.claude/skills/`, `.claude/modules/example-module/`, or this manifest). Semver:
> **MAJOR** — a path is renamed or deleted (adds a 🗑️ row below) or a rule's behavior
> changes in a way that breaks a project already relying on the old one. **MINOR** — a new
> rule, skill, or section is added, purely additive. **PATCH** — wording, doc fixes,
> internal reorg with no behavior change. Since `SYNC-MANIFEST.md` is a ✅ path itself, the
> target's local copy carries whatever version was current at its last sync — that's what
> `/wp-update-from-master` compares against the freshly cloned master's version, before
> running the full diff.

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

> **Master maintenance note** — the master's own `.claude/overview/system-overview-spec.md` is a
> pristine copy of the generator's
> `.claude/skills/wp-system-overview-spec-generator/assets/system-overview-spec.template.md`
> (adoption seeds a project from it). Edit the **asset**, then re-copy it over the master's overview
> so the two never drift. Projects never receive this file — on their side it is 🚫.

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
| `.claude/skills/workspace-spec-discuss/` | `.claude/skills/wp-system-spec-discuss/` |
| `.claude/skills/workspace-brief-to-technical-design/` | `.claude/skills/wp-module-technical-design/` |
| `.claude/skills/workspace-code-trace-spec/` | `.claude/skills/wp-module-code-trace-flow/` |
| `.claude/skills/workspace-save-implementation/` | `.claude/skills/wp-module-save-implementation/` |
| `.claude/skills/workspace-task-brief/` | merged into `.claude/skills/wp-module-plan-discuss/` |
| `.claude/skills/workspace-grill-with-docs/` | merged into `.claude/skills/wp-module-plan-discuss/` |
| `.claude/skills/workspace-asp.net-mvc-frontend-standards/` | `.claude/skills/wp-aspnet-mvc-frontend-standards/` (renamed — skill names allow lowercase letters/digits/hyphens only) |
| `.claude/rules/workspace-plan.impl.md` | `.claude/rules/workspace-plan-impl.md` (renamed to kebab-case, content unchanged — the target's `CLAUDE.md` `@import` line must be updated to match) |
| `.claude/modules/example-module/specs/` | folder concept removed — material → `references/` (`.sql` → `schema/`), work docs → `plans/` |

### `workspace-*` → `wp-*` skill prefix (all 13 skills, content unchanged)

Renamed so typing `/wp` filters to exactly this workflow's skills. **Rule files keep the
`workspace-` prefix on purpose** — they are never typed as commands, so the two prefixes now
signal which is which: `wp-*` = a slash command you invoke, `workspace-*` = an always-on rule
file. Do NOT rename anything under `.claude/rules/`, and do NOT rename
`.claude/workspace-project-stack-architecture.md`.

| Obsolete path (delete in target) | Replaced by |
|---|---|
| `.claude/skills/workspace-system-spec-discuss/` | `.claude/skills/wp-system-spec-discuss/` |
| `.claude/skills/workspace-system-overview-spec-generator/` | `.claude/skills/wp-system-overview-spec-generator/` |
| `.claude/skills/workspace-module-plan-discuss/` | `.claude/skills/wp-module-plan-discuss/` |
| `.claude/skills/workspace-module-technical-design/` | `.claude/skills/wp-module-technical-design/` |
| `.claude/skills/workspace-module-slice-plan/` | `.claude/skills/wp-module-slice-plan/` |
| `.claude/skills/workspace-module-code-trace-flow/` | `.claude/skills/wp-module-code-trace-flow/` |
| `.claude/skills/workspace-module-save-implementation/` | `.claude/skills/wp-module-save-implementation/` |
| `.claude/skills/workspace-auto-test-loop/` | `.claude/skills/wp-auto-test-loop/` |
| `.claude/skills/workspace-aspnet-mvc-frontend-standards/` | `.claude/skills/wp-aspnet-mvc-frontend-standards/` |
| `.claude/skills/workspace-concrete-repository-pattern/` | `.claude/skills/wp-concrete-repository-pattern/` |
| `.claude/skills/workspace-update-from-master/` | `.claude/skills/wp-update-from-master/` |
| `.claude/skills/workspace-obsidian-start/` | `.claude/skills/wp-obsidian-start/` |
| `.claude/skills/workspace-obsidian-progress-log/` | `.claude/skills/wp-obsidian-progress-log/` |

> Deleting these is not cosmetic: a leftover `workspace-*` skill keeps auto-triggering beside its
> `wp-*` replacement, so the agent sees two copies of the same standard. The Step 5b alignment scan
> then rewrites the target's own living docs (`CLAUDE.md`, overview, `MODULE.md`, `<name>-flow.md`)
> from the old names to the new ones.

> Scope: TEMPLATE paths only. A real module's `specs/` folder is project state (🚫) —
> its content is migrated by hand per the workflow routing rule, never deleted by sync.

## Sync procedure

> Preferred: run `/wp-update-from-master` in the target project — it git-clones the
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
