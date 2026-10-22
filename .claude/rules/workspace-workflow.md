# Development Workflow (run every task through these three steps)

## Step 1 · Bring the requirement
Everything — new feature, new module, bug fix, any change — is just a requirement; no need to
pre-classify the task type. At the start, if the user hasn't said anything, Claude proactively
asks for the requirement and offers the on-ramps:

> "What's the requirement? Paste a spec doc · state it directly (name the module/files if you already know) · or let's discuss it if it's still fuzzy."

It can arrive in any form:
- **Full spec doc** → read it; confirm; then route by scope:
  - *Whole-system* overview/spec (what the system is/does) → drop it into `project-memory/overview/references/`, then bootstrap (below).
  - *Single component/feature* requirement doc → raw material: drop into the target module's `references/`; then derive the work doc in `plans/` via `/wp-module-plan-discuss`.
- **Stated directly** → take it; if you already know the target, name the module + files to skip discovery.
- **Any module-level goal, clear or fuzzy** → `/wp-module-plan-discuss` (state the goal first; lands in `plans/`).
- **A whole-system spec is needed but doesn't exist yet** → `/wp-system-spec-discuss` (system-level only: discuss the system spec into existence → `project-memory/overview/references/`, then run the bootstrap). Module-level requirements never need a spec — talk them straight into a work doc in `plans/`.
- **Supporting references** (docs, images, external links) → drop into the matching `references/` folder: system-wide → `project-memory/overview/references/`; shared by several modules but owned by none → `project-memory/docs/`; module-specific → that module's `references/`. Consulted on demand, never auto-loaded.

> Routing rule of thumb: **material received → `references/` (+ ANY `.sql` → `schema/`, whoever wrote it — provided tables/views/indexes and generated seed/test scripts alike); work doc talked out → `plans/`; after the work is done, durable truth settles into `MODULE.md` / `<name>-flow.md`.**

### Not every requirement is module work
Before picking a module, ask: **does the system keep anything after this is done?**
Code, a view, a screen, a schema change shipping into the system → module work, carry on below.
The output is a one-time artifact handed to a person — a report run once, a data patch, an
ad-hoc investigation, a file conversion → it is a **one-off task**: no module, no plan, no
impl record. Route it to Branch D in Step 2. A task that later becomes permanent (the one-off
report gets its own screen) turns into module work at that moment.

### Brand-new system (from a system spec) — bootstrap before any module work
Run `/wp-system-overview-spec-generator` — it owns the bootstrap — then build feature by feature through Step 2.

Pull out **what + why** (purpose is mandatory), then identify the target module(s) and their
state — unless the user already named them. Don't start coding until this is clear; then route to Step 2.

## Step 2 · Core work loop (straight line, no looping back)
Branch first, then act, saving as you go:

| Branch | Module state | First action |
|---|---|---|
| **A Existing module** | already has flow / plans / impl | read BOTH `MODULE.md` (rules first) and `<name>-flow.md` (then the map), then check for unfinished work (below) before starting anything new |
| **B Legacy code** | code exists, no docs | ask me for an entry point → `/wp-module-code-trace-flow` to extract the flow |
| **C Brand-new module** | folder doesn't exist yet | scaffold `project-memory/modules/<name>/` (copy the example-module template) → `/wp-module-plan-discuss` for requirements + plan (lands in `plans/`). *(For a brand-new system, this branch is run once per module derived in Step 1 bootstrap.)* |
| **D One-off task** | no module involved — the system keeps nothing afterwards | do the work, then `/wp-task-record` → one isolated folder `project-memory/tasks/<date>-<slug>/` holding `TASK.md` + its `.sql` and material. Skip Step 3 entirely; that folder IS the record. |

**Branch A · check for unfinished work first.** Every plan carries a one-line status header, so
one grep answers "is something already half-built here?" without opening a single plan:

```bash
grep -H "^> \*\*Status:\*\*" project-memory/modules/<name>/plans/[!_]*.md
```

Across every module at once → `project-memory/project-memory-status.md`, which lists every plan
not `Done` and is rebuilt by a hook on each write to a plan (derived view, never edited; the
plans win on any disagreement).
Anything not `Done` is live work. Open that ONE plan in full — its `Status` says which step it
stopped at, its `> **Resume:**` line (if any) says what was waiting on the user and what comes
next, and its `## Tasks` table (if it has one) says which task is next —
and resume there rather than starting a fresh plan on top of it. Nothing unfinished, or every
header says `Done` → this is new work, carry on below.

Plan landed, and it needs the technical cut and a task breakdown before coding?
→ `/wp-module-technical-design` — appends BOTH a "Technical Design" section (API / classes / patterns / SQL / frontend, at cut level) and a "Tasks" section to the SAME plan file, then wait for the go. Every plan it touches gets a task table; a feature too big for one code→build→test pass gets vertical increments with blocking order, anything smaller gets plain steps. Work the rows top-to-bottom, one at a time, each through the Act loop below — or wave by wave when the `Wave` column carries numbers.

**Parallel waves** — on the user's go per wave. Row #1, the skeleton, runs alone and builds green
first. Each later wave: dispatch one background `Agent` per layer the wave touches (Data / Service /
Web, ownership per `/wp-module-technical-design` → Parallel waves), all in the same working folder —
no worktree, so git and TFVC alike. Each gets pointers only: the plan path, its rows, its owned
files. It writes code and skips the build; a file outside its ownership or a skeleton signature it
needs changed → it stops and reports, the orchestrator decides. Once every agent has returned: one
build, the handling table below, the decision check, then the user tests each row of the wave. A
table whose `Wave` cells are `—`, or that has no `Wave` column, runs one row at a time.

→ Act: **code → build → test** → **save on every change**.
   **Saving includes the plan's status header** — the `> **Status:** ...` line under its H1.
   When a task lands, tick its `✔` cell to `☑` and set the header to `Building · **Detail:** N/M`
   (`N` = `☑` rows, `M` = total rows; a plan with no `## Tasks` table is just `Building`, no `Detail`).
   Do this as you go, not at the end: a session that stops mid-feature must leave the plan
   saying where it stopped, because that line is all the next session gets for free.
   **Build is Claude's; test is the user's.** After each coding chunk Claude runs
   `node .claude/scripts/build-solution.mjs` (it finds the one `.sln` at the project root and
   runs the `msbuild` on `PATH` with `/t:Rebuild` — clean + build every time, so stale outputs
   under `bin\`/`obj\` never hide an error; pass the `.sln` path when the root holds none or several). Exit `0`
   = green, `1` = errors or a failed step, `2` = no `.sln` or no `msbuild` on `PATH`. Every build is
   read, not just its exit code — no log file is kept, so the reply is the record.

   **Whatever the build hits, Claude handles it when it can and stops when it can't.** The test:
   the fix stays inside code this task touched, needs no decision from the user, and breaks no hard
   rule in `project-memory/stack-architecture.md` §4.1. All three hold → handle it and rebuild. Any one
   fails → stop and ask.

   | Claude handles, then rebuilds | Claude stops — the user steps in |
   |---|---|
   | Compile errors in code this task wrote or changed — first errors first, later ones are often cascades | An error in code this task never touched — someone else's breakage, not this task's to rewrite |
   | Warnings in new code (unused variable, unreachable code) | Missing NuGet packages and no `nuget.exe` → restore once in Visual Studio |
   | Missing NuGet packages, when `nuget.exe` is on `PATH` → `nuget restore <sln>` | A copy or file-lock error under `bin\` → Visual Studio or IIS Express holds the DLL; stop debugging |
   | | A missing assembly reference, a `MSB3277` version conflict, or a `Web.config` / `.csproj` change the fix would need |
   | | Exit `2` → put `msbuild` on `PATH` or name the `.sln`; never guess a path |
   | | 5 rounds reached, or the same error survives two rounds |

   **Report every build in the handoff's Done**, interpreted, only what needs attention:
   - **Handled** — each error and warning dealt with: `file(line)` · `CSxxxx` · the cause in one plain
     sentence · what was changed. Never just "fixed"; a restore or other step Claude ran counts too.
   - **Needs you** (when stopped) — the item, why Claude stopped on it, and the exact action. That
     item is the handoff's **👉 You now**; the test waits until the build is green.
   - **Worth knowing** — warnings left alone and why (pre-existing noise in untouched code is skipped,
     repeats are grouped), a skipped project, anything else odd in the output.
   A green build with nothing to note is one line: "build green". Then check decisions, then hand over for test.

   **Decision check — before every test handoff.** A green build proves the code compiles, not that
   it keeps what the module already decided. For each file this chunk changed:
   `grep -l "<FileName>" project-memory/modules/<name>/impl/*.md`, then read only the
   `Decisions + why` and `Ruled out` sections of the records it finds, plus the module's
   `MODULE.md` Local conventions and Known gotchas. A change that reverses a recorded decision or
   brings back a ruled-out option → stop and quote the record (file, date, the line), and ask through
   `AskUserQuestion`: keep the old decision, or override it. An override is recorded in the next impl
   record as "Overrides impl/<file>.md — <why>". Report the outcome in the handoff's Done as one leaf:
   `decision check: no conflict (N records read)`, or the conflict and how it was settled.

   The build compiles C# only: Razor views (`.cshtml`) are not compiled unless the Web project sets
   `MvcBuildViews`, so a green build still leaves view errors for the test to catch.
   **Test is MANUAL — the user runs it.** Wait for the results they report back, and fix from there.

## Step 3 · Wrap up: update memory
For Branches A–C, once the task completes, work through `.claude/rules/workspace-update-memory.md`.

## Every stop ends with a handoff
Every finished task, skill run, or coding chunk, and every blocked stop, ends with the handoff tree — the only place that says what was done. It sits in a `text` fence: each slot a branch, each item a leaf (a Done leaf: path, size, what changed).
- **Closed** — nothing waiting on the user, no live plan the work belongs to, no `🔴` row, no required workflow step pending, nothing still running → **✅ Done** · **🏁 Closed**, then stop. A finished task ends closed, never with an invented follow-up.
- **Open** → **✅ Done** · **⏳ In progress** (only while work runs) · **⚠️ Attention** (only what needs a human) · **👉 You now** · **🔜 Next**.
- **You now**: a choice between options → `AskUserQuestion` in the same turn — recommended option first, then up to 3 real alternatives (**Question pattern**); a manual action (run a `.sql`, test, supply a file) → a plain line.
- **A live plan** → overwrite its `> **Resume:**` line with You now · Next.

Shape, the closed test in full, and every rule: **Handoff** in `.claude/skills/_shared-conventions.md`.
