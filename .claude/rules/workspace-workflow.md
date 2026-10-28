# Development Workflow (run every task through these three steps)

## Step 1 · Bring the requirement
Everything — new feature, new module, bug fix, any change — is just a requirement; no need to
pre-classify the task type. At the start, if the user hasn't said anything, Claude proactively
asks for the requirement and offers the on-ramps:

> "What's the requirement? Paste a spec doc · state it directly (name the module/files if you already know) · or let's discuss it if it's still fuzzy."

It can arrive in any form — read it, confirm, then route:
- **An idea or a problem, not yet a requirement** → `/wp-interview`; it ends in a confirmed goal routed to one of the entries below.
- **Whole-system spec** (format: `.claude/skills/_system-spec-template.md`) → `project-memory/overview/references/`, then the bootstrap (below). None exists and the system needs one → tell the user to run `/wp-system-spec-discuss` first.
- **Module-level requirement** — a feature doc, or a goal stated directly, clear or fuzzy → any doc into the module's `references/`, then `/wp-module-plan-discuss` (lands in `plans/`; module work never needs a spec).
- **Supporting material** → system-wide: `project-memory/overview/references/`; several modules, none owns it: `project-memory/docs/`; one module: its `references/`. Any `.sql` → that module's `schema/`.

After the work, durable truth settles into `MODULE.md` / `<name>-flow.md`.

**Step 1 is done when** the what + why (purpose is mandatory) is stated and the target module(s)
and their branch (A–D) are named — skip the naming when the user already did. Coding starts
after that; then route to Step 2.

### Not every requirement is module work
Before picking a module, ask: **does the system keep anything after this is done?**
Code, a view, a screen, a schema change shipping into the system → module work, carry on below.
The output is a one-time artifact handed to a person — a report run once, a data patch, an
ad-hoc investigation, a file conversion → it is a **one-off task**: no module, no plan, no
impl record. Route it to Branch D in Step 2. A task that later becomes permanent (the one-off
report gets its own screen) turns into module work at that moment.

### A new system, or a new area spanning several modules (from a system spec) — bootstrap before any module work
Tell the user to run `/wp-system-overview-spec-generator` — it owns the bootstrap — then build feature by feature through Step 2.

## Step 2 · Core work loop (straight line, no looping back)
Branch first, then act, saving as you go:

| Branch | Module state | First action |
|---|---|---|
| **A Existing module** | already has flow / plans / impl | read BOTH `MODULE.md` (rules first) and `<name>-flow.md` (then the map), then check for unfinished work (below) before starting anything new |
| **B Legacy code** | code exists, no docs | ask me for an entry point → `/wp-module-code-trace-flow` to extract the flow |
| **C Brand-new module** | folder doesn't exist yet | scaffold `project-memory/modules/<name>/` (copy the example-module template per its `MODULE.md` header note) → `/wp-module-plan-discuss` for requirements + plan (lands in `plans/`). *(For a brand-new system, this branch is run once per module derived in Step 1 bootstrap.)* |
| **D One-off task** | no module involved — the system keeps nothing afterwards | remind the user to type `/wp-task-record` — at the start it clarifies the task, does it and records it; for work already done, when it finishes or stops on a blocker → one isolated folder `project-memory/tasks/<date>-<slug>/` holding `TASK.md` + its `.sql` and material. Skip Step 3 entirely; that folder IS the record. |

**Branch A · check for unfinished work first.** Every plan carries a one-line status header, so
one grep answers "is something already half-built here?" without opening a single plan:

```bash
grep -H "^> \*\*Status:\*\*" project-memory/modules/<name>/plans/[!_]*.md
```

Across every module at once → `project-memory/project-memory-status.md`.
Anything not `Done` is live work. Open that ONE plan in full — its `Status` says which step it
stopped at, its `> **Resume:**` line (if any) says what was waiting on the user and what comes
next, and its `## Tasks` table (if it has one) says which task is next —
and resume there rather than starting a fresh plan on top of it. Nothing unfinished, or every
header says `Done` → this is new work, carry on below.

Plan landed and needs the technical cut and a task breakdown → `/wp-module-technical-design`,
then wait for the go. Work its `## Tasks` rows top to bottom, one at a time through the Act loop
below — wave by wave when the `Wave` column carries numbers.

**Parallel waves** — a `Wave` column with numbers runs wave by wave with no go between waves, up to 4
agents per wave, until a build or decision-check stop:
follow **Parallel waves → Running a wave** in `.claude/skills/wp-module-technical-design/SKILL.md`
before dispatching.

→ Act: **code → build → test** → **save on every change**.
   **Saving includes the plan's status header** — the `> **Status:** ...` line under its H1.
   When a task lands, tick its `✔` cell to `☑` and set the header to
   `> **Status:** Building · **Detail:** N/M · **Updated:** <today>`
   (`N` = `☑` rows, `M` = total rows; no `## Tasks` table → no `Detail`).
   Do this as you go, not at the end: a session that stops mid-feature must leave the plan
   saying where it stopped, because that line is all the next session gets for free.
   **Build is Claude's; test is the user's.** After each coding chunk Claude runs
   `node .claude/scripts/build-solution.mjs` (arguments, exit codes: its header) and reads the whole
   output, not just the exit code — no log file is kept, so the reply is the record.

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
   Wait for the test results the user reports back, and fix from there.

## Step 3 · Wrap up: update memory
For Branches A–C, once the task completes, work through `.claude/rules/workspace-update-memory.md`.

## Every stop ends with a handoff
Every finished task, skill run, or coding chunk, and every blocked stop, ends with the handoff tree — the only place that says what was done. It sits in a `text` fence: each slot a branch, each item a leaf (a Done leaf: path, size, what changed).
- **Closed** — nothing waiting on the user, no live plan the work belongs to, no `🔴` row, no required workflow step pending, nothing still running → **✅ Done** · **🏁 Closed**, then stop. A finished task ends closed, never with an invented follow-up.
- **Open** → **✅ Done** · **⏳ In progress** (only while work runs) · **⚠️ Attention** (only what needs a human) · **👉 You now** · **🔜 Next**.
- **You now**: a choice between options → `AskUserQuestion` in the same turn — recommended option first, then up to 3 real alternatives (**Question pattern**); a manual action (run a `.sql`, test, supply a file) → a plain line.
- **A live plan** → overwrite its `> **Resume:**` line with You now · Next.

Shape, the closed test in full, and every rule: **Handoff** in `.claude/skills/_shared-conventions.md`.
