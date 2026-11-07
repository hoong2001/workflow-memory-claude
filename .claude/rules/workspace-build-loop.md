---
paths:
  - "**/*.cs"
  - "**/*.vb"
  - "**/*.cshtml"
  - "**/*.js"
  - "**/*.csproj"
  - "**/*.vbproj"
  - "**/*.sln"
---

# Build Loop (path-scoped — loads when a code file is read or written)

The build and decision-check half of the Step 2 act loop in `.claude/rules/workspace-workflow.md`.

## Build

After each coding chunk Claude runs `node .claude/scripts/build-solution.mjs` (arguments, exit
codes: its header) and reads the whole output, not just the exit code — no log file is kept, so the
reply is the record. A new SQL query runs once on the local test database (or compiles under
`SET NOEXEC ON`) before the build is reported; Done says what that run returned.

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

The build compiles C# only: Razor views (`.cshtml`) are not compiled unless the Web project sets
`MvcBuildViews`, so a green build still leaves view errors for the test to catch.

## Decision check — before every test handoff

A green build proves the code compiles, not that it keeps what the module already decided. For each
file this chunk changed: `grep -l "<FileName>" project-memory/modules/<name>/impl/*.md`, then read
only the `Decisions + why` and `Ruled out` sections of the records it finds, plus the module's
`MODULE.md` Local conventions and Known gotchas. A change that reverses a recorded decision or brings back a ruled-out option → stop and
quote the record (file, date, the line), and ask through `AskUserQuestion`: keep the old decision,
or override it. An override is recorded in the next impl record as "Overrides impl/<file>.md —
<why>". Report the outcome in the handoff's Done as one leaf: `decision check: no conflict (N
records read)`, or the conflict and how it was settled.
