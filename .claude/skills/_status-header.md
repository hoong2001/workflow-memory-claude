# Status header

Every plan (`project-memory/modules/<name>/plans/<name>-<date>-<slug>.md`), every one-off task
record (`project-memory/tasks/<date>-<slug>/TASK.md`) and every interview record
(`project-memory/interviews/<name>-<date>-<slug>.md`) opens with ONE line directly under its H1:

```markdown
# <title>

> **Status:** Building · **Detail:** 2/5 · **Updated:** 2026-09-07
```

A plan's or an interview record's line holds up to three fields, always in this order (a task
record: **Values — one-off task records**):

- **`Status`** — one bare word from the value set below, never decorated. It names the last thing
  that actually happened to the document — which step the work stopped at, not merely that it
  stopped.
- **`Detail`** — what that status needs said about it: the `N/M` counter, or the reason for a block.
  Present only where the tables below require it; every other status omits the field entirely.
- **`Updated`** — the date this header last changed.

```markdown
> **Status:** Planned · **Updated:** 2026-09-07
> **Status:** Building · **Detail:** 2/5 · **Updated:** 2026-09-07
> **Status:** Blocked · **Detail:** waiting on DBA for the view grant · **Updated:** 2026-09-07
> **Status:** Done · **Updated:** 2026-09-07
```

## Resume line — plans and interview records

A live plan or interview record carries a second line directly under the status line — the
handoff's You now and Next, so a session that opens it weeks later knows what was waiting and what
comes after:

```markdown
> **Status:** Building · **Detail:** 3/5 · **Updated:** 2026-10-15
> **Resume:** You now — test task 3 on the order screen · Next — task 4, export to Excel
```

- **Written at every open handoff that touches a plan**, overwritten in the same edit as the status
  line — never appended. Copy the handoff's You now and Next, shortened to one line; You now
  `nothing` is written as `You now — nothing`. An interview record rewrites it after every answer:
  You now — the question now waiting · Next — the step after it.
- **No Done slot.** What landed is already the `Detail` counter and the `☑` rows (an interview:
  the Answers table); a copy would drift.
- **Deleted when the document turns `Done`** — a closed document has nothing to resume.
- For plans, the hook copies the text after `You now —` (up to ` · Next —`) into the You now column and the
  text after `Next —` into the Next column of `project-memory/project-memory-status.md` (and its
  vault mirror), so keep the order `You now — … · Next — …` with `Next —` last on the line.

## Values — plans

| Status | Detail | Means | Set by |
|---|---|---|---|
| `Planned` | — | The plan exists; nothing else has happened | `/wp-module-plan-discuss` |
| `Designed` | — | `## Technical Design` + `## Tasks` sections have been appended | `/wp-module-technical-design` |
| `Building` | `N/M` if the plan has a `## Tasks` table, else — | Code has started — `N` = `☑` rows, `M` = total rows | the Step 2 act loop |
| `Blocked` | one line: the reason (required) | Stopped on something external, or an open `🔴` row in `## Decisions & open items` | whoever hits the blocker |
| `Done` | — | Finished | `/wp-module-save-implementation` |

The `N/M` counter appears **if and only if** the plan has a `## Tasks` table, and is always
recomputable from that table's `☑` marks — so a stale count self-corrects on the next read instead
of contradicting the table. A plan that builds in one pass has nothing to count and carries no
`Detail`. A `Blocked` plan carries the reason, not the count; the count is still recomputable from
the table.

## Values — one-off task records

A task record's line is `Status · Date · Likely to repeat` (`Detail` after `Status` when
`Blocked`): `> **Status:** Done · **Date:** 2026-09-14 · **Likely to repeat:** Monthly`. `Date` is
the day the work happened.

A one-off task has no design step and no slicing, and its record is written once the work stops, so
it carries two values only:

| Status | Detail | Means | Set by |
|---|---|---|---|
| `Blocked` | one line: the reason (required) | Stopped on something external; the record ends where the work stopped | `/wp-task-record` |
| `Done` | — | Finished | `/wp-task-record` |

## Values — interview records

| Status | Detail | Means | Set by |
|---|---|---|---|
| `Interviewing` | `N/6` — `N` = steps of `/wp-interview` completed | The interview is open | `/wp-interview` |
| `Blocked` | one line: the reason (required) | Waiting on something external — material a colleague holds, a decision only someone else makes | `/wp-interview` |
| `Done` | — | Goal confirmed, route written; continuing it reopens it as `Interviewing` | `/wp-interview` |

## Rules that hold for every record

- **Whoever appends a section to the document sets `Status` to their own value** — no exceptions
  to remember.
- **Keep it on ONE line in that exact shape** — fields in the order `Status · Detail · Updated`,
  separated by ` · `. Unfinished work is found by scanning headers, never
  by opening every file, and a scan that has to parse variations is a scan that silently misses
  work:
  ```bash
  grep -H "^> \*\*Status:\*\*" project-memory/modules/<name>/plans/[!_]*.md
  grep -H "^> \*\*Status:\*\*" project-memory/tasks/*/TASK.md
  grep -H "^> \*\*Status:\*\*" project-memory/interviews/*.md
  ```
  `[!_]` skips `plans/_README.md`, whose example header would otherwise read as live work in
  every module.
- **`Updated` is the date this header last changed**, not the date the document was written.
- **The document is the single source of truth for its own progress.** No one writes a copy by
  hand. The one derived view is `project-memory/project-memory-status.md` — every module plan not
  `Done`, in one table (Done plans are left out, so it never grows with history), rebuilt by the
  `PostToolUse` hook `.claude/hooks/project-memory-status.mjs` on each write to a plan. Read it for
  the system-wide picture; never edit it, and when it disagrees with a plan, the plan wins (rebuild
  it with `node .claude/hooks/project-memory-status.mjs --regenerate`). One-off task records and
  interview records are not in it.
