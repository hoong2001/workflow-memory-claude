---
name: wp-module-technical-design
description: Turn a confirmed plan into a build-ready breakdown: the technical cut (API surface, class/file map, data access, frontend) and the ordered task list — vertical slices, parallel waves when the feature needs them. Use when a plan exists and needs nailing down before coding, or the user says "technical design" or "slice this" / "切片". No plan yet → /wp-module-plan-discuss first.
---

<what-to-do>

Take a confirmed plan and produce the build-ready breakdown: the technical cut (the HOW) and the
ordered task list (in what chunks, in what order). The plan owns the WHAT; this skill owns
everything between that and the first line of code.

## Step 1: Locate and absorb the inputs

1. **The plan** — the user names it; otherwise grep the status headers (`grep -H "^> \*\*Status:\*\*" project-memory/modules/<name>/plans/[!_]*.md`) and take the plan at `Planned`. Several → ask which (Question pattern); none → stop and route to `/wp-module-plan-discuss`. Collect its rows marked `→ /wp-module-technical-design` — this run's inbox; Step 5 starts only when each is `☑`.
2. **Module memory** — read `project-memory/modules/<name>/MODULE.md` (conventions + gotchas), `<name>-flow.md`, `schema/`, and the `impl/` records that name a file on the suspected cut — `grep -l "<FileName>" project-memory/modules/<name>/impl/*.md` per file — reading their `Decisions + why` and `Ruled out` sections.
3. **Hard rules** — apply whatever layering, forbidden patterns, language-version limits, and naming conventions `project-memory/stack-architecture.md` defines; it is non-negotiable.
4. **Project skills** — follow any stack-bound skills present in `.claude/skills/` (e.g. a data-layer pattern skill, a frontend-standards skill); the design must not contradict them.

## Step 2: Explore before inventing

Before proposing anything new, search the real codebase for existing patterns to reuse: a similar page/dashboard, an existing Controller/Service/Repository for the same entity, shared Result classes, existing menu/permission wiring. **Reuse beats create** — every "new file" in the design must justify why nothing existing fits.

## Step 3: Design the cut, one decision at a time

Walk the layers top-down. For each design decision follow the **Question pattern** in `.claude/skills/_shared-conventions.md`.

Cover at minimum:
- **Routes & API surface** — the pages/endpoints this change adds or touches (URL, verb, request/response shape)
- **Class & file map** — which files are NEW, which are MODIFIED, exact names per the architecture doc's layering and naming rules (e.g. Controller / Service / Repository / Result classes in a layered .NET stack) — a design pattern enters only with its named pain and the user's go (`wp-csharp-gof-design-patterns`), written under Decisions + why
- **Data access** — per data-layer method: the query approach (joins, grouping, parameters), which schema tables/views it touches, any performance concern — logic placed on its side of the SQL/Service line per `wp-sql-query-design`
- **Frontend** — view file, script/component structure, which stack components render which widget (e.g. DataTables / ECharts / Select2 / datepicker)
- **Wiring** — whatever the project needs for the change to actually appear: menu/permission registration, route config, bundle/asset registration
- **Deployment** — everything a person must do outside the build for the change to work, in order: each `.sql` to run (any module's `schema/`), config key, file to move, service or app to deploy. Every task that adds one of these puts a line here; a change with none writes `None`

Batch related small decisions into one round; don't interrogate trivia the architecture doc already dictates — just apply the rules.

**Keep it at cut level** — files, methods, SQL approach. No code listings. A cut-level design for a
whole feature costs little and is what makes the next step possible; a full up-front design of every
detail is the speculation this step must not become. Detail per task is deepened when you reach it.

If the plan is missing information the design needs (e.g. an undefined metric formula), surface the
gap and resolve it with the user first — don't design on top of a guess. Record the resolution as a
row in the plan's `## Decisions & open items` table (decision + why, `☑ Resolved`), not just in the
design.

## Step 4: Break it into tasks

**Every plan this skill touches gets a `## Tasks` table — there is no "too small for tasks".** What changes with size
is what the rows are:

| The plan | Rows are | Extra columns carry |
|---|---|---|
| One demoable behavior, builds in one code→build→test pass | The plain steps to do it | `—` for Layers / Blocked by / Wave |
| Multiple behaviors, or a full flow end-to-end | **Vertical increments** (tracer bullets) | Real layers, blocking edges, and waves |
| A wide refactor — one mechanical change across many call sites | **Expand → migrate → contract** batches (**The wide-refactor exception**, below) | Blocking edges in that order |

### When the rows are vertical increments

A **horizontal** slice ships one layer — all the Repository methods, or all the views — and nothing
works until every layer lands. A **vertical** slice ships one narrow path through *every* layer at
once — one Controller action → one Service method → one Repository query → the SQL → the one view
that shows it — so it can be built, manually tested, and demoed the moment it is done.

Slice by **behavior**, never by layer. "Show the customer list" is an increment; "write all the
repositories" is not.

**Prefactor first.** "Make the change easy, then make the easy change" — if any groundwork (a new
shared Result class, a menu/permission slot, a schema tweak) makes the later slices trivial, order
that groundwork as the first increment(s).

**Order by blocking.** Each increment declares **Blocked by:** the increments that must land first,
and blockers are listed earlier in the sequence.

Every increment must be a **full vertical path** that can be built, manually tested, and demoed on
its own — the skeleton and other prefactor rows excepted, done on a green build. If a proposed
increment can't be verified until a *later* one lands, it's a horizontal slice in disguise — re-cut it.

### Parallel waves

Increments that span several layers get a **wave** each, so subagents can write them at once
(**Running a wave** below runs them). Plain steps stay sequential:
`Wave` = `—`.

1. **Skeleton first** — row #1, alone in Wave 1, done when the build is green:
   - every NEW file in the Class & file map, as a stub class registered in its `.csproj`;
   - every new method in the map, as its final signature with a body that throws
     `NotImplementedException`;
   - all wiring — routes, bundles, menu/permission seed, `Web.config`.

   The skeleton freezes the contract between layers and holds every shared-file edit, so later
   waves only fill method bodies.
2. **Wave number** = 1 + the highest wave among the row's `Blocked by` rows. Every non-skeleton
   row is blocked by #1 at minimum.
3. **Agent ownership** — a wave runs as 1–4 subagents; the orchestrator groups the wave's rows by
   file ownership, once the rows are known. Rows whose files are disjoint → one agent per row;
   rows that share files → one agent per layer: **Data** (SQL, Repository, Result), **Service**,
   **Web** (Controller, View, JS). More than 4 groups → merge the smallest. Each file in the Class &
   file map belongs to exactly one agent. A file two agents would both edit → move that edit into
   the skeleton, or add a `Blocked by` edge so the two rows land in different waves.

#### Running a wave

No go between waves: the go after this skill's task list covers every wave. Row #1, the skeleton, runs alone and builds green first. Each later wave: group its rows per **Agent ownership** above and dispatch one background `Agent` per group (at most 4), all in the same working folder — no worktree, so git and TFVC alike. Each gets pointers only: the plan path, its rows, its owned files. It writes code and skips the build; a file outside its ownership or a skeleton signature it needs changed → it stops and reports, the orchestrator decides. Once every agent has returned: one build, the build handling table in `.claude/rules/workspace-workflow.md` Step 2, the decision check. Build green and no decision conflict → start the next wave; either one stops (a "Claude stops" row, a conflict) → stop and ask the user. After the last wave the user tests each row of the table. A table whose `Wave` cells are `—`, or that has no `Wave` column, runs one row at a time.

### Quiz the user before writing

Walk the proposed breakdown with them using the **Question pattern** in `.claude/skills/_shared-conventions.md`. Confirm
granularity, the blocking edges, the waves and the skeleton's contents, and anything to merge or split. Don't publish the table until it is
agreed.

## Step 5: Append both sections and set the status

Append `## Technical Design` and `## Tasks` to the SAME plan document
(`plans/<name>-<date>-<slug>.md`) — never a separate file, so the plan/impl pairing stays
one-to-one. Use the templates below.

**Set the plan's status header to `Designed`** — the line directly under the H1 (rules: the
**Status header** section of `.claude/skills/_shared-conventions.md`):

```markdown
> **Status:** Designed · **Updated:** <today>
```

**Offer a diagram** — `.claude/skills/_optional-diagram.md`.
Options: "No HTML diagram" (recommended) · "Class diagram of the Class & file map" · "Architecture of the
layers touched" (source for both: the `### Class & file map` just written). Link line goes at the end
of that `### Class & file map` section.

**Close with the handoff** — the **Handoff** section of `.claude/skills/_shared-conventions.md`:
Done = the plan path, `Status: Designed`, and the task count; You now = review the `## Tasks` table
and say go; Next = task 1 through the Step 2 act loop (name the task). Coding waits for that go.

</what-to-do>

<supporting-info>

## The wide-refactor exception

One shape breaks the vertical-slice rule: a **wide refactor** — a single mechanical change (rename a shared column, retype a symbol used everywhere) whose blast radius fans across the whole codebase, so one edit breaks hundreds of call sites at once and no thin vertical slice can compile green. Slice it as **expand → migrate → contract** instead:

1. **Expand** — add the new form beside the old so nothing breaks yet.
2. **Migrate** — move call sites over in batches sized by blast radius, one increment per batch; the build stays green throughout because the old form still exists.
3. **Contract** — delete the old form once no caller remains.

## Output template (appended sections)

```markdown
## Technical Design

> Designed: YYYY-MM-DD · derived from the plan above

### API surface

| Endpoint | Verb | Purpose | Request → Response |
|----------|------|---------|--------------------|

### Class & file map

| File | New/Modified | Layer | Responsibility |
|------|--------------|-------|----------------|

<Mermaid flowchart of the files by layer, one arrow per call — **Diagrams** in `.claude/rules/workspace-doc-writing-style.md`>

### Data access

Per Repository method: name, tables/views touched, SQL approach (one short paragraph or bullet), parameters.

<Mermaid flowchart LR of the tables and views each method reads or writes>

Prose after each diagram: ≤3 lines.

### Frontend structure

- View: ...
- JS: ... (widget → component mapping)

### Wiring

- Menu / permission: ...
- Routes / bundles: ...

### Deployment

In this order, paths from the project root:

1. <environment> — run `project-memory/modules/<name>/schema/<file>.sql`
2. <environment> — deploy <project or app>
3. <environment> — <config key / file move>

### Decisions + why

- **Decision:** ... **Why:** ...

### Risks / open technical items

- ...

## Tasks

> Broken down: YYYY-MM-DD · vertical increments | plain steps · parallel waves | one at a time

| # | ✔ | Task | Manager summary | Layers touched | Blocked by | Wave | Done when (verifiable) |
|---|---|------|-----------------|----------------|-----------|------|------------------------|
| 1 | ☐ | Skeleton: stubs, signatures, wiring | Groundwork only — nothing visible changes yet | SQL + Repository + Service + Controller + View | — | 1 | Build green |
| 2 | ☐ | ... | Users can now see the customer list on one screen | SQL + Repository + Service + Controller + View | #1 | 2 | ... |
| 3 | ☐ | ... | ... | ... | #1 | 2 | ... |
| 4 | ☐ | ... | ... | ... | #2 | 3 | ... |

### Notes
- Prefactor / groundwork ordered first: ...
- Wide-refactor tasks (if any) follow expand → migrate → contract: ...
```

The `> Broken down:` line states which kind the rows are, so a reader knows whether each row is
independently demoable or just the next step. The `✔` column starts all `☐`.

## Guardrails

- Keep every row at the level of what gets done, not how — the HOW is the `## Technical Design` section above it, the code is the work loop.
- The **Manager summary** cell is for a reader who never opens the code: what the task delivers or changes for the business, in plain words, under 50 words. No file, class, method, table or layer names — those stay in `Task` and `Layers touched`.
- New gotchas or conventions discovered while exploring code → backfill the module's MODULE.md immediately (one line each).

</supporting-info>
