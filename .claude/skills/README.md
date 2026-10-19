# Skills Map — order, when to use, purpose, output

> One glance at how the workflow skills connect. Each skill's own `SKILL.md` frontmatter
> already states its detailed purpose and "do NOT use" cases — this file is the **map between
> them**: what runs first, what's optional, and which skill answers "what do I reach for now?"

> Rules that several skills share — the question pattern, interview conduct, the handoff block, the status header — live once in
> `_shared-conventions.md` beside this file; the skills point at it instead of each carrying a copy.
> Every skill run closes with the handoff, a tree (each slot a branch, each item a leaf): finished with nothing pending → ✅ Done · 🏁 Closed; still pending → ✅ Done · (⏳ In progress, only while background work runs) · 👉 You now · ⏭ Next, and a You now that is a choice is asked with `AskUserQuestion`. The user always sees what changed, and sees a next step only when one exists.

## Trigger convention

- **User-invoked** (you type `/skill-name`) — the agent never auto-runs these; it may *remind* you they're ready. Everything in the build chain plus `save-implementation`, `task-record`, `update-from-master`, `secret-scan`, `connstr-check`, and the Obsidian memory skills (`wp-obsidian-start`, `wp-obsidian-progress-log`) — the Obsidian pair is never reminded, only invoked.
- **Auto-triggered** — the agent reaches for these on its own when the work matches. Only the coding-standard skills (`repository-unitofwork-pattern`, `sql-query-design`, `csharp-gof-design-patterns`, `aspnet-mvc-frontend-standards`).

## The main flow (module work)

```
                          ┌─ (legacy code, no docs) ──► code-trace-flow ─┐
requirement ──────────────┤                                              ├──► plan in plans/
                          └─ (goal, clear or fuzzy) ──► plan-discuss ─────┘
                                                              │
             (needs the cut + a task list?) ──► technical-design ──┐ appends Technical
                                                              │        │ Design + Tasks to
                                                              │        │ the SAME plan file
                                                              │◄───────┘
                                   ┌──────────────────────────┘
                                   ▼
   code → build → test  ◄── coding standards auto-apply here:
   (Claude builds, fixes or    repository-unitofwork-pattern (DAL) · sql-query-design (any SQL)
    stops to ask; user tests)  csharp-gof-design-patterns (design / refactor)
                               aspnet-mvc-frontend-standards (UI)
                                   │
                                   ▼
                          save-implementation  (wrap up: impl record + sync plan + refresh flow.md)
```

**Brand-new whole system** runs once, upstream of all of the above:
`system-spec-discuss` (only if no spec exists yet) → `system-overview-spec-generator` (bootstrap overview + scaffold the modules) → then each module goes through the main flow.

## Catalog

### Phase 0 · Brand-new system bootstrap (run once, only for a new system)

| # | Skill | When to use | Purpose / function | Output |
|---|-------|-------------|--------------------|--------|
| 0a | `wp-system-spec-discuss` | No whole-system spec exists yet and you want to talk one into being | Discuss a SYSTEM-scope spec into existence (system only, never a single module) | Spec doc in `project-memory/overview/references/` |
| 0b | `wp-system-overview-spec-generator` | A reasonably complete system spec/PRD exists and you want to bootstrap from it | Generate the overview (the WHAT) + scaffold the modules it implies, after ONE sign-off. Existing module folders are never re-scaffolded | `project-memory/overview/system-overview-spec.md` + new module folders |

### Phase 1 · Plan the module work (the on-ramp + optional refinements)

| # | Skill | When to use | Purpose / function | Output |
|---|-------|-------------|--------------------|--------|
| 1 | `wp-module-plan-discuss` | **Any** module-level task, before coding — the ONLY on-ramp for module work docs | Talk a requirement into a work-ready plan via five-element gap detection (Goal/Background/Material/Boundary/DoD) | `plans/<name>-<date>-<slug>.md`, opening `Status: Planned` — fixed shape: Goal · five elements · touch points · decisions & open items |
| 1-alt | `wp-module-code-trace-flow` | You must change existing code but don't know where to start; legacy code with no docs; or you're editing a shared method and need to know who else it touches | Trace the real call chain (depth) AND sweep every shared symbol for all its callers (breadth), refresh `<name>-flow.md`, deliver a "where to cut" + blast-radius recommendation | Updated `<name>-flow.md` (chain + fan-in table) + cut recommendation + blast radius |
| 2 | `wp-module-technical-design` | A plan exists and the technical cut and/or the build order still needs nailing down before coding | Derive the concrete design per the layering rules, then break it into an ordered task list — vertical increments (tracer bullets, blockers-first) when the feature is too big for one code→build→test pass, plain steps when it is not | `## Technical Design` + `## Tasks` appended to the SAME plan file · `Status: Designed` |

> `technical-design` (row 2) is **optional** and appends into the one plan file — never a separate doc. A trivial fix goes straight from the plan to coding. Design always precedes the task list inside it: you cannot name a path through every layer until you know which files sit on it.

### Phase 2 · Build (code → build → test)

| Skill | When to use | Purpose / function | Trigger |
|-------|-------------|--------------------|---------|
| `wp-repository-unitofwork-pattern` | Writing/reviewing any data-access code (Repository, UnitOfWork, Dapper) | The DAL standard: `DynamicParameters` always, no async/DI/stored procs, interfaces only where `stack-architecture.md` allows | Auto |
| `wp-sql-query-design` | Writing/reviewing any SQL — Repository queries, `.sql` schema/seed scripts, persisted test scripts | The query standard: the row-count test draws the SQL↔C# line; keep the remaining SQL simple; `SELECT *` banned; readability-costing rewrites need a measured number | Auto |
| `wp-csharp-gof-design-patterns` | Designing (the class & file map in `technical-design` points here) or refactoring C# Service / ServBackend / integration code, or asking which pattern fits | The pattern standard: a pattern needs a named pain first; five recommended (Template Method, Strategy + Simple Factory, Adapter, Command), three conditional, the rest ruled out for this stack | Auto |
| `wp-aspnet-mvc-frontend-standards` | Writing/reviewing frontend JS (jQuery, Razor→JS, Web API calls, DataTables, Select2…) | The frontend standard: allowed ES6, Store-Then-Bind, per-view JS structure | Auto |

> The build needs no skill — after each coding chunk Claude runs `.claude/scripts/build-solution.mjs` handles what it can, stops for what needs you, and reports both (`workspace-workflow.md` Step 2). Test stays **manual**: you run it.

### Phase 3 · Wrap up

| Skill | When to use | Purpose / function | Output |
|-------|-------------|--------------------|--------|
| `wp-module-save-implementation` | After a feature, refactor, or significant bug fix is done — YOU decide when | Save the impl record (decision + why, files touched, gotchas), close the paired plan's status header, lightweight-refresh `<name>-flow.md` | `impl/<name>-<date>-<slug>.md` + plan `Status: Done` + flow.md |

### Standing · One-off work (no module)

Sits beside the main flow, not inside it. When the system keeps nothing after the work is done —
a report run once, a data patch, an ad-hoc investigation — there is no module to plan against and
no implementation to record, so the whole memory path is this one skill.

| Skill | When to use | Purpose / function | Output |
|-------|-------------|--------------------|--------|
| `wp-task-record` | The output is a one-time artifact handed to a person, and no code, view, or schema ships into the system | One isolated folder per task holding the record, the `.sql` it used, and the material it was given — built around "if this comes back" | `project-memory/tasks/<date>-<slug>/TASK.md` (+ `schema/`, `references/`) |

> The test is one question: **does the system keep anything afterwards?** Yes → module work, use
> the main flow. No → `wp-task-record`, and Step 3 wrap-up is skipped entirely. Task folders are
> git-ignored — they hold real business data.

### Standing · Maintenance

| Skill | When to use | Purpose / function |
|-------|-------------|--------------------|
| `wp-update-from-master` | You want to pull template updates from the master repo | Sync master → project strictly by `SYNC-MANIFEST.md`; never bulk-copies `.claude/` or `project-memory/` |
| `wp-secret-scan` | Adopting this template on an existing project, before making a repo public, or any time you suspect a credential is sitting in the docs | Audit `project-memory/`, `.claude/` and every `.md` for credentials the always-on hook never saw; redact the hits and flag which ones need rotating |
| `wp-connstr-check` | Adopting this template on an existing .NET project, or after config files were edited outside Claude (Visual Studio, a merge, a shell command) | Dry-run every `Web.config` / `App.config` and transform against the house MSSQL `connectionString` template, report the diff with passwords masked, apply on your go |
| `wp-tfvc` | The project is a TFVC workspace (Azure DevOps / TFS), not git | Orient first (this folder's branch, its parent, what is waiting to merge each way), offer merges as choices, then use `tf.exe` the way git is used: status, diff, get latest, add/delete, check-in by explicit path after your go, shelve, history, merge, resolve — always with `/noprompt` |
| `wp-packageref-to-packages-config` | A legacy (non-SDK) .NET Framework `.csproj` / `.vbproj` uses NuGet `PackageReference` and must go back to `packages.config` | Dry run, then on your go write `packages.config` + `Reference`/`HintPath` and the package build imports, clear stale `obj` NuGet files, `nuget restore`, build, and check `bin` for lost DLLs. Needs Python on `PATH` |

> Routine credential blocking needs no skill — `.claude/hooks/block-secrets.mjs` runs as a `PreToolUse` hook on every write and denies it outright. `wp-secret-scan` is the backfill for what predates the hook. Both are governed by `.claude/rules/workspace-no-secrets.md`.
>
> The system-wide plan status also needs no skill — `.claude/hooks/project-memory-status.mjs` runs as a `PostToolUse` hook and rebuilds `project-memory/project-memory-status.md` whenever a module plan is written. The `.claude/skills/mods-plan-status/` folder is a mod, not a skill: it holds `.claude-plugin/plugin.json`, so Claude Code loads it as a plugin from the skills folder (origin `@skills-dir`, documented) the moment the project is opened and trusted — it travels with the project, no install. It must never also be listed in a marketplace: a skills-dir plugin whose name matches an installed plugin is not loaded (`name "mods-plan-status" is already taken by an installed plugin`). Once loaded it shows that file's live plans in a pane, hidden at session start until `/mods-plan-status show` (or a toggle band that runs it) opens it. Each plan in the pane is a numbered entry, its full file name led by a `[ @ ]` button: a click inserts `@project-memory/modules/<name>/plans/<plan>.md ` into the prompt box at the cursor, so the plan rides along as a file mention. It reads only the table format it knows (`TABLE_FORMAT`, the same marker in the hook and in its `hooks/parse.ts`) and shows a warning on any other.
>> Two more mods sit beside it, loaded the same way: `mods-context-panel/` shows everything `/context` shows, live in a pane (`/mods-context-panel show|hide`), and `mods-toggle-band/` draws one row of toggle buttons above the prompt — `● Plans` / `○ Context` — that run those two commands and read each pane's own `isShown`, so a pane closed any other way shows `○` too (`/mods-toggle-band` hides or shows the row). Both panes start hidden; only the toggle row shows at session start.
>
> TFVC needs no mod either. `wp-tfvc` teaches Claude to drive `tf.exe` in a TFVC workspace the way it drives git in a git repo — orienting on the branch tree before every request, the git → tf command map, and the traps that cause real damage: `/noprompt` on every command that accepts it (without it `tf` opens a GUI dialog and the shell hangs), check-in by explicit path only, detected adds/deletes that must be pended, and conflicts never resolved by picking a side blindly.
>
> So does the connection-string format — `.claude/hooks/connstr-check.mjs` runs as a `PostToolUse` hook on every write to a `Web.config` / `App.config` (and their transforms) and rejects an MSSQL `connectionString` that departs from the house template, naming the corrected string. `node .claude/hooks/connstr-check.mjs --fix <root>` lists the fixes for existing files; add `--write` to apply them. `wp-connstr-check` wraps that sweep for files the hook never saw — it only fires on Claude's Write / Edit / MultiEdit, not on Visual Studio or shell edits.
>
> Template updates need no skill to be noticed — `.claude/hooks/template-update-check.mjs` runs as a `SessionStart` hook, compares the project's `SYNC-MANIFEST.md` version with the master's on GitHub, and says `Workflow template update available: X → Y` when the master is newer. Applying the update is still `wp-update-from-master`, on the user's go.

### Standing · Cross-project memory (Obsidian)

Adjacent to the module flow — a lightweight record that lives in the user's central Obsidian vault, so a project paused for a while can be resumed and nothing built is lost from view. `wp-obsidian-progress-log` is the cross-project counterpart to `save-implementation` (shallow snapshot vs. the deep in-project record). Optional: not everyone uses Obsidian, so no workflow step reminds you to run these — invoke them when you want them.

The always-current half needs no skill: on a machine with a vault path configured (`wp-obsidian-progress-log/references/vault-path.local.json`, else `~/.claude/progress-vault.json`, both `{ "vaultPath": "..." }`), the `project-memory-status.mjs` hook mirrors each project's `project-memory-status.md` into `Project Progress/<project>/_plans.md` and rebuilds `Project Progress/_Live plans.md` — every project's own table, verbatim, under a heading per project, the project with the oldest plan first. One table format: change it in the hook's `render()` and the board follows. Plain Markdown, so any editor reads it. No config → the hook skips it silently.

| Skill | When to use | Purpose / function | Trigger |
|-------|-------------|--------------------|---------|
| `wp-obsidian-progress-log` | Log/read a project's progress snapshot (modules, done work, next step), or see what's stalled across projects | Expandable cards in the vault — a project card + one card per module, aggregated by two Bases (projects oldest-first, and modules grouped by project); deep record stays in `impl/`/`plans/`. Dual-track write: `obsidian` CLI if present, else direct file | User-invoked |
| `wp-obsidian-start` | You want to use Obsidian but haven't pinned the action | Entry-point dispatcher — infers intent and routes to the right Obsidian skill (CLI, Markdown, Bases, Canvas, capture, or `wp-obsidian-progress-log`); reinvents nothing | User-invoked |

## Quick "what do I reach for?" forks

- **New requirement, no plan yet** → `plan-discuss` (always; it's the only door).
- **Existing feature, don't know where the code is** → `code-trace-flow` first, then `plan-discuss`.
- **Plan done, need API/class/SQL detail, or a task breakdown, or both** → `technical-design` (it does the cut and the task list in one pass).
- **Should this calculation be in the query or the service?** → `sql-query-design` (the row-count test).
- **Should this be a Strategy / Factory / some pattern?** → `csharp-gof-design-patterns` (no named pain, no pattern).
- **Plan done, builds in one pass** → just code; skip `technical-design`.
- **Done coding a milestone** → remember `save-implementation` (your trigger, not the agent's).
- **Resuming a project after a gap / "where was I?"** → `wp-obsidian-progress-log` (RESUME), or `wp-obsidian-start` if unsure which Obsidian skill you need.
- **One-off report / data patch, nothing ships into the system** → `wp-task-record` (skip the module layer and Step 3 entirely).
- **Brand-new system** → `system-spec-discuss` (if needed) → `system-overview-spec-generator`, then per-module main flow.
- **Worried a password or API key made it into the docs** → `wp-secret-scan`.
- **Config files edited outside Claude, or connection strings all over the place** → `wp-connstr-check`.
- **Project is in TFVC, not git — check in, get latest, shelve, merge (which branch → which)** → `wp-tfvc`.
- **A .NET Framework project uses `PackageReference` and must switch to `packages.config`** → `wp-packageref-to-packages-config`.
