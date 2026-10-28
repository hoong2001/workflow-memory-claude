# Skills Map — order, when to use, purpose, output

> One glance at how the workflow skills connect. Each skill's own `SKILL.md` frontmatter
> already states its detailed purpose and "do NOT use" cases — this file is the **map between
> them**: what runs first, what's optional, and which skill answers "what do I reach for now?"

> Rules that several skills share — the purpose gate, the question pattern, the handoff block, the status header — live once in
> `_shared-conventions.md` beside this file; the skills point at it instead of each carrying a copy.
> The whole-system spec format lives the same way in `_system-spec-template.md`: `system-spec-discuss`
> writes it, `system-overview-spec-generator` reads it.

## Trigger convention

- **User-invoked** (`disable-model-invocation: true`) — only you can run these: type `/wp-<name>`. The agent never fires them; where a rule names one, it tells you to run it, and the wrap-up reminders name the full command to type (`/wp-module-save-implementation`, `/wp-retro`, `/wp-task-record`). `module-save-implementation`, `task-record`, `retro`, `system-spec-discuss`, `system-overview-spec-generator`, `update-from-master`, `secret-scan`, `connstr-check`, `packageref-to-packages-config`, `obsidian-start`.
- **User-triggered** (model-invocable, never auto-run) — you type `/skill-name`, or ask in words and the agent fires it. Everything in the build chain, `wp-interview`, and `wp-obsidian-progress-log` — the Obsidian skill is never reminded, only invoked.
- **Auto-triggered** — the agent reaches for these on its own when the work matches. The coding-standard skills (`repository-unitofwork-pattern`, `sql-query-design`, `csharp-gof-design-patterns`, `aspnet-mvc-frontend-standards`) and the steering-file writing standard (`writing-for-agents`).

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
                                   │
                                   ▼  only when the wrap-up names a friction signal
                          retro  (fix the environment: pointer · check · rule — you pick)
```

**A new system, or a new area spanning several modules of a live one** runs upstream of all of the above:
`system-spec-discuss` (only if no spec exists yet) → `system-overview-spec-generator` (first bootstrap, or an expansion re-run that grows the overview in place) → each module through the main flow.

**Only an idea or a problem, no requirement yet** — `interview` runs first and ends in a confirmed goal,
routed to one of the entry points above or to a one-off task.

## Catalog

### Before a requirement · an idea or a problem (optional)

| Skill | When to use | Purpose / function | Output |
|-------|-------------|--------------------|--------|
| `wp-interview` | You have a spark, a want, or a problem, but no requirement yet, or don't know where to start | Interview the idea or problem through a funnel (spark or problem → want → purpose → goal), one clickable question at a time until the *what* is settled, then rounds of up to 3; asks for reference docs, diagrams, meeting notes, flowcharts; routes the confirmed goal to the skill that builds it, which takes the record attached, named, or pasted; a past interview — attached as `@<record>` or found unfinished by its status line — continues from its `Resume` line, a `Done` one reopens | `project-memory/interviews/<name>-<date>-<slug>.md` — status header (`Interviewing` · `N/6`, `Blocked`, `Done`) + `Resume` line, answers, material, risks, route · supplied files in `project-memory/interviews/references/<date>-<slug>/` until the route moves them |

### Phase 0 · System bootstrap (a new system, or a new area spanning several modules of a live one)

| # | Skill | When to use | Purpose / function | Output |
|---|-------|-------------|--------------------|--------|
| 0a | `wp-system-spec-discuss` | A new system, or a new area spanning several modules of a live one, has no spec yet and you want to talk one into being | Discuss a SYSTEM-scope spec into existence (system only, never a single module) as the system's architect: proposes the System Design — context, modules and data ownership, entry points, quality requirements, shared mechanisms — for you to challenge; an interview record pre-fills the sections it settles | Spec doc in `project-memory/overview/references/` |
| 0b | `wp-system-overview-spec-generator` | A system spec/PRD that covers the template's required sections exists and you want to bootstrap from it | Bootstrap: the overview (the WHAT) + the modules it implies; on a live system, an expansion re-run grows the overview in place and appends the new capabilities to the existing modules it touches | `project-memory/overview/system-overview-spec.md` + new module folders |

### Phase 1 · Plan the module work (the on-ramp + optional refinements)

| # | Skill | When to use | Purpose / function | Output |
|---|-------|-------------|--------------------|--------|
| 1 | `wp-module-plan-discuss` | **Any** module-level task, before coding — the ONLY on-ramp for module work docs | Talk a requirement into a work-ready plan via five-element gap detection (Goal/Background/Material/Boundary/DoD); an interview record states the goal and pre-fills the elements it settles | `plans/<name>-<date>-<slug>.md`, opening `Status: Planned` — fixed shape: Goal · five elements · touch points · decisions & open items |
| 1-alt | `wp-module-code-trace-flow` | You must change existing code but don't know where to start; legacy code with no docs; or you're editing a shared method and need to know who else it touches | Trace the real call chain (depth) AND sweep every shared symbol for all its callers (breadth), refresh `<name>-flow.md`, deliver a "where to cut" + blast-radius recommendation | Updated `<name>-flow.md` (chain + Mermaid sequence diagram + fan-in table) + cut recommendation + blast radius · optional archify diagram, asked once |
| 2 | `wp-module-technical-design` | A plan exists and the technical cut and/or the build order still needs nailing down before coding | Derive the concrete design per the layering rules, then break it into an ordered task list — vertical increments (tracer bullets, blockers-first) when the feature is too big for one code→build→test pass, plain steps when it is not; increments spanning several layers get a skeleton row and parallel waves | `## Technical Design` + `## Tasks` appended to the SAME plan file · `Status: Designed` |

> `technical-design` (row 2) is **optional** and appends into the one plan file — never a separate doc. A trivial fix goes straight from the plan to coding. Design always precedes the task list inside it: you cannot name a path through every layer until you know which files sit on it.

### Phase 2 · Build (code → build → test)

| Skill | When to use | Purpose / function | Trigger |
|-------|-------------|--------------------|---------|
| `wp-repository-unitofwork-pattern` | Writing/reviewing any data-access code (Repository, UnitOfWork, Dapper) | The DAL standard: `DynamicParameters` always, no stored procedures; the stack's forbidden list is `project-memory/stack-architecture.md` §4.1 | Auto |
| `wp-sql-query-design` | Writing/reviewing any SQL — Repository queries, `.sql` schema/seed scripts, persisted test scripts | The query standard: the row-count test draws the SQL↔C# line; keep the remaining SQL simple; `SELECT *` banned; readability-costing rewrites need a measured number | Auto |
| `wp-csharp-gof-design-patterns` | Designing (the class & file map in `technical-design` points here) or refactoring C# Service / ServBackend / integration code, or asking which pattern fits | The pattern standard: a pattern needs a named pain and the user's go first; five recommended (Template Method, Strategy + Simple Factory, Adapter, Command), three conditional, the rest ruled out for this stack | Auto |
| `wp-aspnet-mvc-frontend-standards` | Writing/reviewing frontend JS (jQuery, Razor→JS, Web API calls, DataTables, Select2…) | The frontend standard: allowed ES6, Store-Then-Bind, per-view JS structure | Auto |

> The build, the Decision check and the manual test need no skill — `.claude/rules/workspace-workflow.md` Step 2.

### Phase 3 · Wrap up

| Skill | When to use | Purpose / function | Output |
|-------|-------------|--------------------|--------|
| `wp-module-save-implementation` | After a feature, refactor, or significant bug fix is done — YOU decide when | Save the impl record (decision + why, ruled out, files touched, gotchas), close the paired plan's status header, lightweight-refresh `<name>-flow.md` | `impl/<name>-<date>-<slug>.md` + plan `Status: Done` + flow.md |
| `wp-retro` | The session hit friction — the wrap-up reminder names the signal (`workspace-update-memory.md` item 7), or you just felt it was harder than it should be | Trace each struggle to a moment in the session, classify it, route it: mechanical → a check, judgement → a standard skill or `MODULE.md`, always-on lines that changed nothing → delete; template changes go to the master. Adapted from `retro` in `mattpocock/skills` | Ranked candidates (max 5); only the ones you pick are applied |

### Standing · One-off work (no module)

The test is one question: **does the system keep anything afterwards?** Yes → module work, the
main flow. No → `wp-task-record` (folder layout: the skill), and Step 3 is skipped.

| Skill | When to use | Purpose / function | Output |
|-------|-------------|--------------------|--------|
| `wp-task-record` | The output is a one-time artifact handed to a person — typically a data check or a report the system does not have — and no code, view, or schema ships into the system | Typed at the start: clarifies the task in one round of up to 3 questions (no goal yet → `wp-interview`), does it, then records it; typed after the work: records it. One isolated folder per task, built around "if this comes back"; an interview record answers the opening questions and seeds the request | `project-memory/tasks/<date>-<slug>/` |

### Standing · Maintenance

| Skill | When to use | Purpose / function |
|-------|-------------|--------------------|
| `wp-writing-for-agents` | Auto — creating or editing a skill or rule under `.claude/`, or `CLAUDE.md`; `wp-retro` loads it first | The steering-file writing standard: context pointers, the two loads, information hierarchy, completion criteria, leading words, the no-op test. `project-memory/` is out of its scope (people read those too — `workspace-doc-writing-style.md`). Fork of `writing-for-agents` from `mattpocock/skills` v1.3.1, MIT (`LICENSE-mattpocock`); local changes: name, description, the scope paragraph |
| `wp-update-from-master` | You want to pull template updates from the master repo | Sync master → project strictly by `SYNC-MANIFEST.md`; never bulk-copies `.claude/` or `project-memory/` |
| `wp-secret-scan` | Adopting this template on an existing project, before making a repo public, or any time you suspect a credential is sitting in the docs | Audit `project-memory/`, `.claude/` and every `.md` for credentials the always-on hook never saw; redact the hits and flag which ones need rotating |
| `wp-connstr-check` | Adopting this template on an existing .NET project, or after config files were edited outside Claude (Visual Studio, a merge, a shell command) | Dry-run every `Web.config` / `App.config` and transform against the house MSSQL `connectionString` template, report the diff with passwords masked, apply on your go |
| `wp-tfvc` | The project is a TFVC workspace (Azure DevOps / TFS), not git | Orient first (this folder's branch, its parent, what is waiting to merge each way), offer merges as choices, then use `tf.exe` the way git is used: status, diff, get latest, add/delete, check-in by explicit path after your go, shelve, history, merge, resolve — always with `/noprompt` |
| `wp-packageref-to-packages-config` | A legacy (non-SDK) .NET Framework `.csproj` / `.vbproj` uses NuGet `PackageReference` and must go back to `packages.config` | Dry run, then on your go write `packages.config` + `Reference`/`HintPath` and the package build imports, clear stale `obj` NuGet files, `nuget restore`, build, and check `bin` for lost DLLs. Needs Python on `PATH` |

> Hooks need no skill; each file's header owns its behaviour (wired in `.claude/settings.json`):
> - `.claude/hooks/block-secrets.mjs` — denies a credential written to a guarded path; backfill: `wp-secret-scan`; rule: `.claude/rules/workspace-no-secrets.md`.
> - `.claude/hooks/project-memory-status.mjs` — rebuilds `project-memory/project-memory-status.md` when a module plan is written.
> - `.claude/hooks/connstr-check.mjs` — rejects an off-template MSSQL `connectionString` that Claude writes; config edited elsewhere: `wp-connstr-check`.
> - `.claude/hooks/template-update-check.mjs` — at session start, says when the master template is newer; applying it: `wp-update-from-master`.
> - `.claude/hooks/idea-interview-hint.mjs` — at every session start, one line pointing at `wp-interview`.

### Standing · Cross-project memory (Obsidian)

Adjacent to the module flow — a lightweight record that lives in the user's central Obsidian vault, so a project paused for a while can be resumed and nothing built is lost from view. `wp-obsidian-progress-log` is the cross-project counterpart to `save-implementation` (shallow snapshot vs. the deep in-project record). Optional: not everyone uses Obsidian, so no workflow step reminds you to run these — invoke them when you want them.

The always-current half needs no skill: on a machine with a vault path configured, the `project-memory-status.mjs` hook mirrors the status table into the vault — config and layout in the hook's header.

| Skill | When to use | Purpose / function | Trigger |
|-------|-------------|--------------------|---------|
| `wp-obsidian-progress-log` | Log/read a project's progress snapshot (modules, done work, next step), or see what's stalled across projects | Expandable cards in the vault — a project card + one card per module, aggregated by two Bases (projects oldest-first, and modules grouped by project); deep record stays in `impl/`/`plans/`. Dual-track write: `obsidian` CLI if present, else direct file | User-triggered |
| `wp-obsidian-start` | You want to use Obsidian but haven't pinned the action | Entry-point dispatcher — infers intent and routes to the right Obsidian skill (CLI, Markdown, Bases, Canvas, capture, or `wp-obsidian-progress-log`); reinvents nothing | User-invoked |

## Quick "what do I reach for?" forks

- **Only an idea or a problem, don't know where to start** → `interview` (ends in a confirmed goal and the command to type next).
- **New requirement, no plan yet** → `plan-discuss` (always; it's the only door).
- **Existing feature, don't know where the code is** → `code-trace-flow` first, then `plan-discuss`.
- **Plan done, need API/class/SQL detail, or a task breakdown, or both** → `technical-design` (it does the cut and the task list in one pass).
- **Should this calculation be in the query or the service?** → `sql-query-design` (the row-count test).
- **Should this be a Strategy / Factory / some pattern?** → `csharp-gof-design-patterns` (no named pain, no pattern).
- **Plan done, builds in one pass** → just code; skip `technical-design`.
- **Done coding a milestone** → type `/wp-module-save-implementation` (your trigger, not the agent's).
- **The session fought you — rebuilds, repeated corrections, a long hunt for one fact** → type `/wp-retro` (fixes the workflow so it does not recur; the code is not its job).
- **Resuming this project after a gap / "where was I?"** → `project-memory/project-memory-status.md`, then the live plan's `> **Resume:**` line.
- **Where do all my projects stand?** → `wp-obsidian-progress-log` (RESUME), or type `/wp-obsidian-start` if unsure which Obsidian skill you need.
- **One-off check, report or data patch, nothing ships into the system** → type `/wp-task-record` at the start: it clarifies, does the work and records it (no module layer, no Step 3).
- **Brand-new system, or a new area spanning several modules of a live one** → type `/wp-system-spec-discuss` (if needed) → `/wp-system-overview-spec-generator`, then per-module main flow.
- **Worried a password or API key made it into the docs** → type `/wp-secret-scan`.
- **Config files edited outside Claude, or connection strings all over the place** → type `/wp-connstr-check`.
- **Project is in TFVC, not git — check in, get latest, shelve, merge (which branch → which)** → `wp-tfvc`.
- **A .NET Framework project uses `PackageReference` and must switch to `packages.config`** → `wp-packageref-to-packages-config`.
