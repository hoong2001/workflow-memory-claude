# Skills Map — order, when to use, purpose, output

> One glance at how the workflow skills connect. Each skill's own `SKILL.md` frontmatter
> already states its detailed purpose and "do NOT use" cases — this file is the **map between
> them**: what runs first, what's optional, and which skill answers "what do I reach for now?"

## Trigger convention

- **User-invoked** (you type `/skill-name`) — the agent never auto-runs these; it may *remind* you they're ready. Everything in the build chain plus `save-implementation`, `auto-test-loop`, `update-from-master`.
- **Auto-triggered** — the agent reaches for these on its own when the work matches. Only the coding-standard skills (`concrete-repository-pattern`, `aspnet-mvc-frontend-standards`).

## The main flow (module work)

```
                          ┌─ (legacy code, no docs) ──► code-trace-flow ─┐
requirement ──────────────┤                                              ├──► plan in plans/
                          └─ (goal, clear or fuzzy) ──► plan-discuss ─────┘
                                                              │
                        (need the technical cut?) ──► technical-design ──┐ append to
                                                              │           │ SAME plan file
                        (too big for one pass?)  ──► slice-plan ─────────┘
                                                              │
                                   ┌──────────────────────────┘
                                   ▼
   code → build → test  ◄── coding standards auto-apply here:
   (build/test are MANUAL,     concrete-repository-pattern (DAL) · aspnet-mvc-frontend-standards (UI)
    user runs them)            optional: /auto-test-loop (user-invoked build+test loop)
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
| 0a | `workspace-system-spec-discuss` | No whole-system spec exists yet and you want to talk one into being | Discuss a SYSTEM-scope spec into existence (system only, never a single module) | Spec doc in `.claude/overview/references/` |
| 0b | `workspace-system-overview-spec-generator` | A reasonably complete system spec/PRD exists and you want to bootstrap from it | Generate the overview (the WHAT) + scaffold the modules it implies, after ONE sign-off. Existing module folders are never re-scaffolded | `.claude/overview/system-overview-spec.md` + new module folders |

### Phase 1 · Plan the module work (the on-ramp + optional refinements)

| # | Skill | When to use | Purpose / function | Output |
|---|-------|-------------|--------------------|--------|
| 1 | `workspace-module-plan-discuss` | **Any** module-level task, before coding — the ONLY on-ramp for module work docs | Talk a requirement into a work-ready plan via five-element gap detection (Goal/Background/Material/Boundary/DoD) | `plans/<name>-<date>-<slug>.md` |
| 1-alt | `workspace-module-code-trace-flow` | You must change existing code but don't know where to start; legacy code with no docs; or you're editing a shared method and need to know who else it touches | Trace the real call chain (depth) AND sweep every shared symbol for all its callers (breadth), refresh `<name>-flow.md`, deliver a "where to cut" + blast-radius recommendation | Updated `<name>-flow.md` (chain + fan-in table) + cut recommendation + blast radius |
| 2 | `workspace-module-technical-design` | A plan exists and only the technical cut (API/classes/SQL/frontend) is missing | Derive the concrete design per the layering rules | `## Technical Design` appended to the SAME plan file |
| 3 | `workspace-module-slice-plan` | A plan describes a feature too big for one code→build→test pass | Slice into ordered vertical increments (tracer bullets), blockers-first | `## Build Increments` appended to the SAME plan file |

> Phases 2 and 3 are **optional** and both append to the one plan file — never a separate doc. Trivial fixes skip straight from Phase 1 to coding.

### Phase 2 · Build (code → build → test)

| Skill | When to use | Purpose / function | Trigger |
|-------|-------------|--------------------|---------|
| `workspace-concrete-repository-pattern` | Writing/reviewing any data-access code (Repository, UnitOfWork, Dapper) | The DAL standard: `DynamicParameters` always, no interfaces/async/DI/stored procs | Auto |
| `workspace-aspnet-mvc-frontend-standards` | Writing/reviewing frontend JS (jQuery, Razor→JS, Web API calls, DataTables, Select2…) | The frontend standard: allowed ES6, Store-Then-Bind, per-view JS structure | Auto |
| `workspace-auto-test-loop` | You explicitly ask to build + test a change | Compile via MSBuild, auto-fix compile errors, CRUD-only data checks, web-test the flow against a site YOU started | User-invoked only |

> Build and test are **manual** by default (you run them in Visual Studio). `auto-test-loop` is the sole exception, and only when you invoke it.

### Phase 3 · Wrap up

| Skill | When to use | Purpose / function | Output |
|-------|-------------|--------------------|--------|
| `workspace-module-save-implementation` | After a feature, refactor, or significant bug fix is done — YOU decide when | Save the impl record (decision + why, files touched, gotchas), tick the paired plan, lightweight-refresh `<name>-flow.md` | `impl/<name>-<date>-<slug>.md` + synced plan + flow.md |

### Standing · Maintenance

| Skill | When to use | Purpose / function |
|-------|-------------|--------------------|
| `workspace-update-from-master` | You want to pull template updates from the master repo | Sync master → project strictly by `SYNC-MANIFEST.md`; never bulk-copies `.claude/` |

## Quick "what do I reach for?" forks

- **New requirement, no plan yet** → `plan-discuss` (always; it's the only door).
- **Existing feature, don't know where the code is** → `code-trace-flow` first, then `plan-discuss`.
- **Plan done, need API/class/SQL detail** → `technical-design`.
- **Plan done, feature is large** → `slice-plan`, then build increments one at a time.
- **Plan done, builds in one pass** → just code; skip 2 and 3.
- **Done coding a milestone** → remember `save-implementation` (your trigger, not the agent's).
- **Brand-new system** → `system-spec-discuss` (if needed) → `system-overview-spec-generator`, then per-module main flow.
