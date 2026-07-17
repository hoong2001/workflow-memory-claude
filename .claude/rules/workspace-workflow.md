# Development Workflow (run every task through these three steps)

## Step 1 · Bring the requirement
Everything — new feature, new module, bug fix, any change — is just a requirement; no need to
pre-classify the task type. At the start, if the user hasn't said anything, Claude proactively
asks for the requirement and offers the on-ramps:

> "What's the requirement? Paste a spec doc · state it directly (name the module/files if you already know) · or let's discuss it if it's still fuzzy."

It can arrive in any form:
- **Full spec doc** → read it; confirm; then route by scope:
  - *Whole-system* overview/spec (what the system is/does) → `.claude/overview/system-overview-spec.md` (one per system).
  - *Single component/feature* requirement doc → raw material: drop into the target module's `references/` (and any `.sql` table schemas into `schema/`); then derive the work doc in `plans/` via `/workspace-module-plan-discuss`.
- **Stated directly** → take it; if you already know the target, name the module + files to skip discovery.
- **Any module-level goal, clear or fuzzy** → `/workspace-module-plan-discuss` (state the goal first; five-element gap detection scales the depth — trivial fix converges in one confirmation, conflicts get challenged, blanks get interviewed; lands in `plans/`).
- **A whole-system spec is needed but doesn't exist yet** → `/workspace-system-spec-discuss` (system-level only: discuss the system spec into existence → `.claude/overview/references/`, then run the bootstrap). Module-level requirements never need a spec — talk them straight into a work doc in `plans/`.
- **Supporting references** (docs, images, external links) → drop into the matching `references/` folder: system-wide → `.claude/overview/references/`; module-specific → that module's `references/`. Consulted on demand, never auto-loaded.

> Routing rule of thumb: **material received → `references/` (+ `.sql` → `schema/`); work doc talked out → `plans/`; after the work is done, durable truth settles into `MODULE.md` / `<name>-flow.md`.** There is no module-level `specs/` folder.

### Brand-new system (from a system spec) — bootstrap before any module work
When the requirement is a whole-system spec, derive the modules from it first. The
`workspace-system-overview-spec-generator` skill executes these steps; this list is their source of truth.
1. **Fill** `.claude/overview/system-overview-spec.md` from the spec — especially §4 Capability Map. **WHAT only — no stack/HOW in the overview.**
2. **Tech reconciliation**: extract the spec's stack/framework and diff it against `.claude/workspace-project-stack-architecture.md` → two lists: **Overlaps** (consistent) and **Inconsistencies** (conflicts with / missing from the architecture doc). Never auto-edit the architecture doc; never silently discard the spec's tech.
3. **Decompose**: turn the §4 capabilities into a proposed module breakdown (`name → capabilities → key dependencies`).
4. **ONE sign-off checkpoint**: present the **tech reconciliation report (step 2)** + the **module decomposition (step 3)** together, and wait for my confirmation. In the decomposition, mark every module as **NEW** (folder doesn't exist) or **EXISTING** (folder already under `.claude/modules/`). Module boundaries and any architecture-doc change are mine to decide. Do NOT scaffold or touch the Module Map before this nod.
5. **On sign-off** → register the agreed breakdown in overview §5 Module Composition **and** the root `CLAUDE.md` Module Map; then **scaffold each NEW module** via Step 2 Branch C (loop), seeding each module's "What this module does" from the spec and **binding module-relevant tech into that module's `MODULE.md` "Local conventions"** (tech travels with the module, not the overview).
   **Idempotence hard rule (re-run / system expansion): an EXISTING module folder is NEVER re-scaffolded or template-overwritten** — its `MODULE.md`, `plans/`, `impl/`, `schema/`, `references/`, and flow doc are the project's accumulated memory (no undo on a synced drive). Existing modules get incremental updates only: append new capabilities to their `MODULE.md` description / Local conventions, and refresh overview §4/§5 + the Module Map row.
6. Then build feature by feature through the normal Step 2 loop.

Pull out **what + why** (purpose is mandatory), then identify the target module(s) and their
state — unless the user already named them. Don't start coding until this is clear; then route to Step 2.

## Step 2 · Core work loop (straight line, no looping back)
Branch first, then act, saving as you go:

| Branch | Module state | First action |
|---|---|---|
| **A Existing module** | already has flow / plans / impl | read `<name>-flow.md` and pick up |
| **B Legacy code** | code exists, no docs | ask me for an entry point → `/workspace-module-code-trace-flow` to extract the flow |
| **C Brand-new module** | folder doesn't exist yet | scaffold `.claude/modules/<name>/` (copy the example-module template) → `/workspace-module-plan-discuss` for requirements + plan (lands in `plans/`). *(For a brand-new system, this branch is run once per module derived in Step 1 bootstrap.)* |

Plan landed but the technical cut still needs nailing down (API / classes / SQL / frontend)?
→ `/workspace-module-technical-design` — appends a "Technical Design" section to the SAME plan file, then wait for the go.

→ Act: **code → build → test** → **save on every change**.
   **Build and test are MANUAL — the user runs them** (e.g. in Visual Studio). Claude never
   auto-runs MSBuild or tests: after coding, remind the user in one line to build + test, wait
   for the results they report back, and fix from there.
   **Sole exception:** the user explicitly invokes `/workspace-auto-test-loop` — that invocation
   IS the authorization for Claude to build (MSBuild), auto-fix compile errors, run CRUD-only SQL
   checks, and web-test, for that run only. Never auto-trigger it; the site is still user-started.

## Step 3 · Wrap up: update memory
After the task completes, run through `workspace-update-memory.md`:
impl record (date / decision+why / status / links — **remind the user to run `/workspace-module-save-implementation`; never auto-run it, the trigger is theirs**) → backfill gotchas to the module →
archive the plan → update the index (module map, flow) → architecture changes → keep `CLAUDE.md` lean.
