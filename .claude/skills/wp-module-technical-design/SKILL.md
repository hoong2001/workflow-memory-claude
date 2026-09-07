---
name: wp-module-technical-design
description: Turn a confirmed plan (from /wp-module-plan-discuss) into a build-ready breakdown — the technical cut (API surface, class/file map per the project's layering, data access, frontend) AND the ordered task list that says in what verifiable chunks it gets built, vertically sliced when the feature needs it. Both append to the SAME plan document in the module's plans/ folder. Use when a plan exists and the work needs nailing down before coding, or the user says "generate technical design", "design the API/classes", "slice this", "break this into increments", "brief to design", "切片". Do NOT use when no plan exists yet (run /wp-module-plan-discuss first), or for requirement discussion.
---

<what-to-do>

Take a confirmed plan and produce the build-ready breakdown: the technical cut (the HOW) and the
ordered task list (in what chunks, in what order). The plan owns the WHAT; this skill owns
everything between that and the first line of code. Both sections append to the same plan file.

Design comes before the task list, always. Cutting a feature into slices means naming a thin path
through every layer — and you cannot name the path until you know which files sit on it. Slicing
first is guesswork dressed as planning.

## Step 1: Locate and absorb the inputs

1. **The plan** — the user names it, otherwise take the most recent file in the target module's `plans/`. If none exists, stop and route to `/wp-module-plan-discuss`.
2. **Module memory** — read `project-memory/modules/<name>/MODULE.md` (conventions + gotchas), `<name>-flow.md`, `schema/`, and skim `impl/` for prior decisions that constrain this design.
3. **Hard rules** — apply whatever layering, forbidden patterns, language-version limits, and naming conventions `project-memory/stack-architecture.md` defines; it is non-negotiable.
4. **Project skills** — follow any stack-bound skills present in `.claude/skills/` (e.g. a data-layer pattern skill, a frontend-standards skill); the design must not contradict them.

## Step 2: Explore before inventing

Before proposing anything new, search the real codebase for existing patterns to reuse: a similar page/dashboard, an existing Controller/Service/Repository for the same entity, shared Result classes, existing menu/permission wiring. **Reuse beats create** — every "new file" in the design must justify why nothing existing fits.

## Step 3: Design the cut, one decision at a time

Walk the layers top-down. For each design decision follow the **question pattern** (always via
`AskUserQuestion`: recommended answer + 3 alternatives + 1 custom) in `.claude/skills/_shared-conventions.md`.

Cover at minimum:
- **Routes & API surface** — the pages/endpoints this change adds or touches (URL, verb, request/response shape)
- **Class & file map** — which files are NEW, which are MODIFIED, exact names per the architecture doc's layering and naming rules (e.g. Controller / Service / Repository / Result classes in a layered .NET stack)
- **Data access** — per data-layer method: the query approach (joins, grouping, parameters), which schema tables/views it touches, any performance concern
- **Frontend** — view file, script/component structure, which stack components render which widget (e.g. DataTables / ECharts / Select2 / datepicker)
- **Wiring** — whatever the project needs for the change to actually appear: menu/permission registration, route config, bundle/asset registration

Batch related small decisions into one round; don't interrogate trivia the architecture doc already dictates — just apply the rules.

**Keep it at cut level** — files, methods, SQL approach. No code listings. A cut-level design for a
whole feature costs little and is what makes the next step possible; a full up-front design of every
detail is the speculation this step must not become. Detail per task is deepened when you reach it.

## Step 4: Break it into tasks

**Every plan gets a `## Tasks` table — there is no "too small for tasks".** What changes with size
is what the rows are:

| The plan | Rows are | Extra columns carry |
|---|---|---|
| One demoable behavior, builds in one code→build→test pass | The plain steps to do it | `—` for Layers / Blocked by |
| Multiple behaviors, a full flow end-to-end, or a wide refactor | **Vertical increments** (tracer bullets) | Real layers and blocking edges |

### When the rows are vertical increments

A **horizontal** slice ships one layer — all the Repository methods, or all the views — and nothing
works until every layer lands. A **vertical** slice ships one narrow path through *every* layer at
once — one Controller action → one Service method → one Repository query → the SQL → the one view
that shows it — so it can be built, manually built + tested, and demoed the moment it is done.

Slice by **behavior**, never by layer. "Show the customer list" is an increment; "write all the
repositories" is not.

**Prefactor first.** "Make the change easy, then make the easy change" — if any groundwork (a new
shared Result class, a menu/permission slot, a schema tweak) makes the later slices trivial, order
that groundwork as the first increment(s).

**Order by blocking.** Each increment declares **Blocked by:** the increments that must land first,
and blockers are listed earlier in the sequence. This project is single-developer with **manual
build/test** (`workspace-workflow.md` Step 2): rows are worked top-to-bottom, one at a time — build
one, remind the user to build + test it, fix, then start the next. There is no parallel fleet; the
blocking edges only fix the order.

**Don't manufacture increments.** A feature that genuinely builds in one pass gets plain steps, not
five ceremonial slices. Say so and move on.

### Quiz the user before writing

Walk the proposed breakdown with them using the **question pattern** (always via `AskUserQuestion`:
recommended answer + 3 alternatives + 1 custom) in `.claude/skills/_shared-conventions.md`. Confirm
granularity, the blocking edges, and anything to merge or split. Don't publish the table until it is
agreed.

## Step 5: Append both sections and set the status

Append `## Technical Design` and `## Tasks` to the SAME plan document
(`plans/<name>-<date>-<slug>.md`) — never a separate file, so the plan/impl pairing stays
one-to-one. Use the templates below and project-root-relative paths only (see
`workspace-doc-relative-paths.md`).

**Set the plan's status header to `Designed`** — the `> **Status:** ...` line directly under the H1:

```markdown
> **Status:** Designed · **Updated:** <today>
```

Appending these sections is real progress and the header must say so, otherwise a plan that already
carries a full design and task list still reads `Planned` and the next session redoes it from
scratch. `Designed` is also precise about what did NOT happen: no code exists yet, so nobody goes
hunting for half-written classes.

Stop after the breakdown is confirmed. Coding starts only on the user's go, and each task runs
through the normal Step 2 work loop (code → build → test → save).

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

### Data access

Per Repository method: name, tables/views touched, SQL approach (one short paragraph or bullet), parameters.

The SQL approach follows `wp-sql-query-design` — place logic on the correct side of the
SQL/Service line here, or the build inherits the wrong cut.

### Frontend structure

- View: ...
- JS: ... (widget → component mapping)

### Wiring

- Menu / permission: ...
- Routes / bundles: ...

### Decisions + why

- **Decision:** ... **Why:** ...

### Risks / open technical items

- ...

## Tasks

> Broken down: YYYY-MM-DD · vertical increments | plain steps · worked top-to-bottom, one at a time

| # | ✔ | Task | Layers touched | Blocked by | Done when (verifiable) |
|---|---|------|----------------|-----------|------------------------|
| 1 | ☐ | ... | SQL + Repository + Service + Controller + View | — | ... |
| 2 | ☐ | ... | ... | #1 | ... |

### Notes
- Prefactor / groundwork ordered first: ...
- Wide-refactor tasks (if any) follow expand → migrate → contract: ...
```

The `> Broken down:` line states which kind the rows are, so a reader knows whether each row is
independently demoable or just the next step. The `✔` column starts all `☐`; as tasks land, the
Step 2 act loop flips them to `☑` and turns the status header into `Building N/M`, deriving `N`
from the `☑` marks in this table.

## Guardrails

- A design that violates the stack hard rules is dead on arrival — fix it before presenting, don't present-then-apologise.
- If the plan is missing information the design needs (e.g. an undefined metric formula), surface the gap and resolve it with the user first — don't design on top of a guess. Record the resolution back into the plan's element sections, not just the design.
- Keep the design at cut-level (files, methods, SQL approach) — no full code listings; code belongs to implementation.
- When the rows are vertical increments, every one must be a **full vertical path** that can be manually built, tested, and demoed on its own. If a proposed increment can't be verified until a *later* one lands, it's a horizontal slice in disguise — re-cut it.
- Keep every row at the level of what gets done, not how — the HOW is the `## Technical Design` section above it, the code is the work loop.
- New gotchas or conventions discovered while exploring code → backfill the module's MODULE.md immediately (one line each).

</supporting-info>
