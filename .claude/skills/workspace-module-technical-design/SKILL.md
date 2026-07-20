---
name: workspace-module-technical-design
description: Turn a confirmed plan (from /workspace-module-plan-discuss) into a concrete technical design — API surface, class/file map per the project's layering, data access, and frontend structure — appended as a "Technical Design" section to the SAME plan document in the module's plans/ folder. Use when a plan exists and the user wants the technical breakdown nailed down before coding, says "generate technical design", "design the API/classes", or "brief to design". Do NOT use when no plan exists yet (run /workspace-module-plan-discuss first), or for requirement discussion.
---

<what-to-do>

Take a confirmed plan and derive the technical design from it, decision by decision, then append the design to the same plan file. The plan owns the WHAT; this skill produces the HOW for this change.

## Step 1: Locate and absorb the inputs

1. **The plan** — the user names it, otherwise take the most recent file in the target module's `plans/`. If none exists, stop and route to `/workspace-module-plan-discuss`.
2. **Module memory** — read `.claude/modules/<name>/MODULE.md` (conventions + gotchas), `<name>-flow.md`, `schema/`, and skim `impl/` for prior decisions that constrain this design.
3. **Hard rules** — apply whatever layering, forbidden patterns, language-version limits, and naming conventions `.claude/workspace-project-stack-architecture.md` defines; it is non-negotiable.
4. **Project skills** — follow any stack-bound skills present in `.claude/skills/` (e.g. a data-layer pattern skill, a frontend-standards skill); the design must not contradict them.

## Step 2: Explore before inventing

Before proposing anything new, search the real codebase for existing patterns to reuse: a similar page/dashboard, an existing Controller/Service/Repository for the same entity, shared Result classes, existing menu/permission wiring. **Reuse beats create** — every "new file" in the design must justify why nothing existing fits.

## Step 3: Design, one decision at a time

Walk the layers top-down. For each design decision follow the two-step pattern:

1. **Infer first** — state your recommended design with reasoning (from the plan, the code, the constraints). Let the user simply accept it.
2. **Options on rejection** — if rejected, present 4 concrete alternatives plus one free-form choice (use AskUserQuestion when available; recommendation first, marked "(Recommended)"). Each option is a real direction with a one-line trade-off.

Cover at minimum:
- **Routes & API surface** — the pages/endpoints this change adds or touches (URL, verb, request/response shape)
- **Class & file map** — which files are NEW, which are MODIFIED, exact names per the architecture doc's layering and naming rules (e.g. Controller / Service / Repository / Result classes in a layered .NET stack)
- **Data access** — per data-layer method: the query approach (joins, grouping, parameters), which schema tables/views it touches, any performance concern
- **Frontend** — view file, script/component structure, which stack components render which widget (e.g. DataTables / ECharts / Select2 / datepicker)
- **Wiring** — whatever the project needs for the change to actually appear: menu/permission registration, route config, bundle/asset registration

Batch related small decisions into one round; don't interrogate trivia the architecture doc already dictates — just apply the rules.

## Step 4: Append the design to the plan

When the design has converged, append a `## Technical Design` section to the SAME plan document (`plans/<name>-<date>-<slug>.md`) — never a separate file, so the plan/impl pairing stays one-to-one. Use the output template below. Use project-root-relative paths only (see `workspace-doc-relative-paths.md`).

Stop after the design is confirmed. Coding starts only on the user's go.

</what-to-do>

<supporting-info>

## Output template (appended section)

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
```

## Guardrails

- A design that violates the stack hard rules is dead on arrival — fix it before presenting, don't present-then-apologise.
- If the plan is missing information the design needs (e.g. an undefined metric formula), surface the gap and resolve it with the user first — don't design on top of a guess. Record the resolution back into the plan's element sections, not just the design.
- New gotchas or conventions discovered while exploring code → backfill the module's MODULE.md immediately (one line each).
- Keep the design at cut-level (files, methods, SQL approach) — no full code listings; code belongs to implementation.

</supporting-info>
