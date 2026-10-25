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
| Version | `15.2.0` |

Override by editing this block, or by giving the skill a different URL/branch when it asks.
A **local master path** is the fallback only — for working offline or testing an unpushed
master; git is the default source.

> **Version policy** — bump on any commit that touches a ✅ path below. Semver:
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
| `.claude/hooks/` | Hook scripts, wired in by the `.claude/settings.json` merge below (whole folder) |
| `.claude/scripts/` | Scripts the workflow runs, such as the build step (whole folder) |
| `.claude/adoption-conformance-scan.md` | Conformance-scan procedure, read once when a project adopts the template |
| `project-memory/modules/example-module/` | Module scaffold template |
| `project-memory/overview/references/_README.md` | System-references folder conventions (the folder's own files are never synced) |
| `project-memory/tasks/_README.md` | One-off task folder conventions (the folder's own records are never synced) |
| `project-memory/docs/_README.md` | Shared-docs folder conventions (the folder's own files are never synced) |
| `SYNC-MANIFEST.md` | This manifest itself |

## 🏠 Master-only (never copied to projects)

Root `README.md`, `LICENSE` — they describe/govern the master repo itself.

`.gitignore` is master-only as a FILE, but carries template-side lines — see the grey zone below.

## 🚫 Never overwrite (project state — overwriting loses progress permanently)

| Path | What it is |
|---|---|
| `project-memory/modules/<any real module>/` | MODULE.md, schema/, plans/, impl/, references/, `<name>-flow.md` — the project's accumulated memory |
| `project-memory/overview/system-overview-spec.md` | That system's functional spec |
| `project-memory/overview/references/<any file but _README.md>` | That system's reference materials |
| `project-memory/docs/<any file but _README.md>` | Shared files several modules lean on but none owns |
| `project-memory/interviews/` | Interview records written by `wp-interview` |
| `project-memory/tasks/<any task folder>/` | One-off task records — `TASK.md`, `schema/`, `references/`. Git-ignored in the target too, so a sync never sees them |
| `project-memory/project-memory-status.md` | Generated from the target's own plans by its own `project-memory-status.mjs` hook — copying the master's would show the master's modules. Rebuild it in the target with `node .claude/hooks/project-memory-status.mjs --regenerate` |
| Root `CLAUDE.md` Module Map section | Project state (see grey zone below) |

> **Master maintenance note** — the master's own `project-memory/overview/system-overview-spec.md` is a
> pristine copy of the generator's
> `.claude/skills/wp-system-overview-spec-generator/assets/system-overview-spec.template.md`
> (adoption seeds a project from it). Edit the **asset**, then re-copy it over the master's overview
> so the two never drift. Projects never receive this file — on their side it is 🚫.

## ⚠️ Grey zone (manual merge only — never mechanical copy)

| Path | Template part | Project part |
|---|---|---|
| Root `CLAUDE.md` | Structure + `@import` lines | Module Map rows, "What this system is" |
| `project-memory/stack-architecture.md` | Default stack/architecture baseline | Any project-specific customization |
| `project-memory/stack-architecture.next.md` | Staged, partly-unsealed draft of the baseline — inert until the user renames it to `stack-architecture.md` | A target that already switched holds its own copy under `stack-architecture.md`; merge into that file, never re-create the draft beside it |
| `.claude/settings.json` | Every `hooks` entry that runs a `.claude/hooks/` script, plus clean-up of the retired `workflow-memory-local` marketplace — see the merge note below | Every other hook, permission, and setting the project has added |
| Root `.gitignore` | The `*.local.json` line and the `project-memory/tasks/*` + `!project-memory/tasks/_README.md` block, each with its comment. Drop the `.claude/skills/*/.claude-plugin/types/` line (and its comment) an earlier sync added — no skill folder holds a mod any more | Every other ignore rule the project has |

> **`.claude/settings.json` merge:** merge every `hooks` entry of the master's
> `.claude/settings.json` that runs a `.claude/hooks/` script into the same event array
> (`hooks.SessionStart`, `hooks.PreToolUse`, `hooks.PostToolUse`, …) of the target's file. An
> entry in the target that runs the same script, or a retired one (a `.claude/hooks/` script the
> master no longer ships, such as `block-secrets.ps1`), is replaced — never add a second entry
> beside it. Delete the leftovers of the retired `workflow-memory-local` marketplace:
> `extraKnownMarketplaces.workflow-memory-local` and every `enabledPlugins` key ending
> `@workflow-memory-local`. Then run `node .claude/hooks/project-memory-status.mjs --regenerate`
> once, so the target's `project-memory/project-memory-status.md` is rebuilt from its own plans in
> the current table format. A target with no `.claude/settings.json` takes the master's file whole.

> **`.gitignore` merge:** add only those lines (plus their comments) to the target's existing
> file. Without them a project commits machine-local config and its ad-hoc task records — report
> queries, customer data — into its repo. A project with a private repo that WANTS its task
> records versioned skips the tasks block.

**Merge procedure for grey-zone files:** diff master vs. target, apply only the
template-side changes (e.g. the `@import` line of a new rule without `paths:` frontmatter), keep all project-side
content untouched. A rule that gained `paths:` frontmatter loses its `@import` line in the target's
`CLAUDE.md` (e.g. `@.claude/rules/workspace-sql-house-style.md`) — an import loads it at launch.

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
| `.claude/skills/workspace-asp.net-mvc-frontend-standards/` | `.claude/skills/wp-aspnet-mvc-frontend-standards/` |
| `.claude/skills/wp-idea-interview/` | `.claude/skills/wp-interview/` — the hook `idea-interview-hint.mjs` keeps its name; records in `project-memory/interviews/` stay where they are |
| `.claude/rules/workspace-plan.impl.md` | `.claude/rules/workspace-plan-impl.md` — update the target's `CLAUDE.md` `@import` line to match |
| `project-memory/modules/example-module/specs/` | nothing — delete it; the module `specs/` folder concept is gone |
| `.claude/hooks/block-secrets.ps1` | `.claude/hooks/block-secrets.mjs` — repoint the `.claude/settings.json` entry at `block-secrets.mjs` |
| `.claude/skills/wp-module-slice-plan/` | merged into `.claude/skills/wp-module-technical-design/` |
| `.claude/skills/wp-concrete-repository-pattern/` | `.claude/skills/wp-repository-unitofwork-pattern/` |
| `.claude/skills/wp-plan-status/` | nothing — delete it; the optional `mods-plan-status` plugin (marketplace `hoong2001/workflow-memory-mods`) replaces it |
| `.claude/mods/` (whole folder, in the target) | nothing — delete it; `.claude/skills/wp-tfvc/` replaces the old `tfvc` mod and the optional `mods-plan-status` plugin (marketplace `hoong2001/workflow-memory-mods`) replaces `plan-status`. Drop the `.claude/mods/*/.claude-plugin/types/` line from the target's `.gitignore`, clean `.claude/settings.json` per the grey-zone note, and on each machine run `claude plugin uninstall tfvc@workflow-memory-local --scope user` and `claude plugin marketplace remove workflow-memory-local` if `claude plugin list` still shows them |
| `.claude/mods/plan-status/` | nothing — delete it; the optional `mods-plan-status` plugin (marketplace `hoong2001/workflow-memory-mods`) replaces it. On each machine run `claude plugin uninstall plan-status@workflow-memory-local --scope user` if `claude plugin list` shows it |
| `.claude/skills/wp-auto-test-loop/` | nothing — delete it; Claude's build step is `.claude/scripts/build-solution.mjs` (`workspace-workflow.md` Step 2) and test is manual. A target's existing `schema/test/` scripts are project state and stay |
| `.claude/skills/plan-status/` | nothing — delete it; the optional `mods-plan-status` plugin (marketplace `hoong2001/workflow-memory-mods`) replaces it. The `plan-status-table` marker in `project-memory/project-memory-status.md` is a data contract and keeps its name |
| `.claude/skills/context-panel/` | nothing — delete it |
| `.claude/skills/mod-panel/` | nothing — delete it |
| `.claude/skills/mods-plan-status/` | nothing — delete it; the optional `mods-plan-status` plugin (marketplace `hoong2001/workflow-memory-mods`) replaces it: `/plugin install mods-plan-status --marketplace hoong2001/workflow-memory-mods` on each machine that wants the pane |
| `.claude/skills/mods-context-panel/` | nothing — delete it |
| `.claude/skills/mods-toggle-band/` | nothing — delete it |

### `workspace-*` → `wp-*` skill prefix

`wp-*` names a skill you invoke, `workspace-*` a rule file — never rename a file under `.claude/rules/` or `project-memory/stack-architecture.md`.

| Obsolete path (delete in target) | Replaced by |
|---|---|
| `.claude/skills/workspace-system-spec-discuss/` | `.claude/skills/wp-system-spec-discuss/` |
| `.claude/skills/workspace-system-overview-spec-generator/` | `.claude/skills/wp-system-overview-spec-generator/` |
| `.claude/skills/workspace-module-plan-discuss/` | `.claude/skills/wp-module-plan-discuss/` |
| `.claude/skills/workspace-module-technical-design/` | `.claude/skills/wp-module-technical-design/` |
| `.claude/skills/workspace-module-slice-plan/` | merged into `.claude/skills/wp-module-technical-design/` |
| `.claude/skills/workspace-module-code-trace-flow/` | `.claude/skills/wp-module-code-trace-flow/` |
| `.claude/skills/workspace-module-save-implementation/` | `.claude/skills/wp-module-save-implementation/` |
| `.claude/skills/workspace-auto-test-loop/` | nothing — delete it |
| `.claude/skills/workspace-aspnet-mvc-frontend-standards/` | `.claude/skills/wp-aspnet-mvc-frontend-standards/` |
| `.claude/skills/workspace-concrete-repository-pattern/` | `.claude/skills/wp-repository-unitofwork-pattern/` |
| `.claude/skills/workspace-update-from-master/` | `.claude/skills/wp-update-from-master/` |
| `.claude/skills/workspace-obsidian-start/` | `.claude/skills/wp-obsidian-start/` |
| `.claude/skills/workspace-obsidian-progress-log/` | `.claude/skills/wp-obsidian-progress-log/` |

> The alignment scan of `/wp-update-from-master` (its Step 5b) rewrites the target's living docs from these old names to the new ones.

## Sync procedure

Run `/wp-update-from-master` in the target project — the skill owns the procedure. The freshly
cloned master's copy of this manifest is the authority, never the target's local copy.
