# Skills Map — order, when to use, purpose, output

> One glance at how the workflow skills connect. Each skill's own `SKILL.md` frontmatter
> already states its detailed purpose and "do NOT use" cases — this file is the **map between
> them**: what runs first, what's optional, and which skill answers "what do I reach for now?"

> Rules that several skills share — the question pattern, interview conduct — live once in
> `_shared-conventions.md` beside this file; the skills point at it instead of each carrying a copy.

## Trigger convention

- **User-invoked** (you type `/skill-name`) — the agent never auto-runs these; it may *remind* you they're ready. Everything in the build chain plus `save-implementation`, `auto-test-loop`, `update-from-master`, `secret-scan`, and the Obsidian memory skills (`wp-obsidian-start`, `wp-obsidian-progress-log`).
- **Auto-triggered** — the agent reaches for these on its own when the work matches. Only the coding-standard skills (`concrete-repository-pattern`, `sql-query-design`, `aspnet-mvc-frontend-standards`).

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
   (build/test are MANUAL,     concrete-repository-pattern (DAL) · sql-query-design (any SQL)
    user runs them)            aspnet-mvc-frontend-standards (UI)
                               optional: /auto-test-loop (user-invoked build+test loop)
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
| 1 | `wp-module-plan-discuss` | **Any** module-level task, before coding — the ONLY on-ramp for module work docs | Talk a requirement into a work-ready plan via five-element gap detection (Goal/Background/Material/Boundary/DoD) | `plans/<name>-<date>-<slug>.md`, opening `Status: Planned` |
| 1-alt | `wp-module-code-trace-flow` | You must change existing code but don't know where to start; legacy code with no docs; or you're editing a shared method and need to know who else it touches | Trace the real call chain (depth) AND sweep every shared symbol for all its callers (breadth), refresh `<name>-flow.md`, deliver a "where to cut" + blast-radius recommendation | Updated `<name>-flow.md` (chain + fan-in table) + cut recommendation + blast radius |
| 2 | `wp-module-technical-design` | A plan exists and the technical cut and/or the build order still needs nailing down before coding | Derive the concrete design per the layering rules, then break it into an ordered task list — vertical increments (tracer bullets, blockers-first) when the feature is too big for one code→build→test pass, plain steps when it is not | `## Technical Design` + `## Tasks` appended to the SAME plan file · `Status: Designed` |

> `technical-design` (row 2) is **optional** and appends into the one plan file — never a separate doc. A trivial fix goes straight from the plan to coding. Design always precedes the task list inside it: you cannot name a path through every layer until you know which files sit on it.

### Phase 2 · Build (code → build → test)

| Skill | When to use | Purpose / function | Trigger |
|-------|-------------|--------------------|---------|
| `wp-concrete-repository-pattern` | Writing/reviewing any data-access code (Repository, UnitOfWork, Dapper) | The DAL standard: `DynamicParameters` always, no interfaces/async/DI/stored procs | Auto |
| `wp-sql-query-design` | Writing/reviewing any SQL — Repository queries, `.sql` schema/seed scripts, persisted test scripts | The query standard: the row-count test draws the SQL↔C# line; keep the remaining SQL simple; `SELECT *` banned; readability-costing rewrites need a measured number | Auto |
| `wp-aspnet-mvc-frontend-standards` | Writing/reviewing frontend JS (jQuery, Razor→JS, Web API calls, DataTables, Select2…) | The frontend standard: allowed ES6, Store-Then-Bind, per-view JS structure | Auto |
| `wp-auto-test-loop` | You explicitly ask to build + test a change | Compile via MSBuild, auto-fix compile errors, CRUD-only data checks, web-test the flow against a site YOU started | User-invoked only |

> Build and test are **manual** by default (you run them in Visual Studio). `auto-test-loop` is the sole exception, and only when you invoke it.

### Phase 3 · Wrap up

| Skill | When to use | Purpose / function | Output |
|-------|-------------|--------------------|--------|
| `wp-module-save-implementation` | After a feature, refactor, or significant bug fix is done — YOU decide when | Save the impl record (decision + why, files touched, gotchas), close the paired plan's status header, lightweight-refresh `<name>-flow.md` | `impl/<name>-<date>-<slug>.md` + plan `Status: Done` + flow.md |

### Standing · Maintenance

| Skill | When to use | Purpose / function |
|-------|-------------|--------------------|
| `wp-update-from-master` | You want to pull template updates from the master repo | Sync master → project strictly by `SYNC-MANIFEST.md`; never bulk-copies `.claude/` or `project-memory/` |
| `wp-secret-scan` | Adopting this template on an existing project, before making a repo public, or any time you suspect a credential is sitting in the docs | Audit `project-memory/`, `.claude/` and every `.md` for credentials the always-on hook never saw; redact the hits and flag which ones need rotating |

> Routine credential blocking needs no skill — `.claude/hooks/block-secrets.ps1` runs as a `PreToolUse` hook on every write and denies it outright. `wp-secret-scan` is the backfill for what predates the hook. Both are governed by `.claude/rules/workspace-no-secrets.md`.

### Standing · Cross-project memory (Obsidian)

Adjacent to the module flow — a lightweight record that lives in the user's central Obsidian vault, so a project paused for a while can be resumed and nothing built is lost from view. `wp-obsidian-progress-log` is the cross-project counterpart to `save-implementation` (shallow snapshot vs. the deep in-project record) and is reminded at Step 3 wrap-up.

| Skill | When to use | Purpose / function | Trigger |
|-------|-------------|--------------------|---------|
| `wp-obsidian-progress-log` | Log/read a project's progress snapshot (modules, done work, next step), or see what's stalled across projects | Expandable cards in the vault — a project card + one card per module, aggregated by two Bases (projects oldest-first, and modules grouped by project); deep record stays in `impl/`/`plans/`. Dual-track write: `obsidian` CLI if present, else direct file | User-invoked (reminded at Step 3) |
| `wp-obsidian-start` | You want to use Obsidian but haven't pinned the action | Entry-point dispatcher — infers intent and routes to the right Obsidian skill (CLI, Markdown, Bases, Canvas, capture, or `wp-obsidian-progress-log`); reinvents nothing | User-invoked |

## Quick "what do I reach for?" forks

- **New requirement, no plan yet** → `plan-discuss` (always; it's the only door).
- **Existing feature, don't know where the code is** → `code-trace-flow` first, then `plan-discuss`.
- **Plan done, need API/class/SQL detail, or a task breakdown, or both** → `technical-design` (it does the cut and the task list in one pass).
- **Should this calculation be in the query or the service?** → `sql-query-design` (the row-count test).
- **Plan done, builds in one pass** → just code; skip `technical-design`.
- **Done coding a milestone** → remember `save-implementation` (your trigger, not the agent's); then `wp-obsidian-progress-log` to refresh the cross-project card.
- **Resuming a project after a gap / "where was I?"** → `wp-obsidian-progress-log` (RESUME), or `wp-obsidian-start` if unsure which Obsidian skill you need.
- **Brand-new system** → `system-spec-discuss` (if needed) → `system-overview-spec-generator`, then per-module main flow.
- **Worried a password or API key made it into the docs** → `wp-secret-scan`.
