# Shared skill conventions

Not a skill — a shared reference for the workflow skills in this folder, so one rule used by
several skills has exactly one wording. A skill that names a section below follows it in full;
nothing here overrides a skill's own explicit instruction.

## Purpose gate

**No purpose, no session.** A skill that names this gate starts its steps only once the purpose of
the work — what it is for and why — is stated: by the user in this request or earlier in the
conversation, or by an interview record (**Interview record as input** below). Missing → ask for it
in one line and wait for the user's words; an inferred purpose does not count. A user with no
purpose yet → `/wp-interview`, which ends in one.

## Question pattern

Every choice between options Claude puts to the user — in a discussion skill or anywhere else — goes through the `AskUserQuestion` tool — never a
plain-text statement waiting for a nod, and never gated behind a rejection first. The same holds
for a decision left in a handoff's **You now** (see **Handoff** below). A request for free
information (the opening "what's the requirement?") may be plain text.

1. **Infer, then ask** — work out your recommended answer from the plan, the module docs,
   the code, or the stack constraints, and use it as the first option, marked "(Recommended)".
2. **Up to 3 more real alternatives + 1 custom** — each alternative a genuine, distinct
   direction with a one-line trade-off; when fewer real ones exist, list fewer — never filler to
   pad the count. `AskUserQuestion`'s built-in "Other" serves as the free-form custom choice.

If `AskUserQuestion` is unavailable in the current environment, fall back to listing the
same options as numbered plain text and asking the user to pick one or state a custom answer —
never revert to a bare statement waiting for a nod.

## Handoff

Every skill run ends with a handoff, and so does every task that runs without a skill
(`.claude/rules/workspace-workflow.md` applies it there). It answers what just happened — and,
only when something is still pending, what is the user's to do and what comes after.

**First judge: is the work closed?** It is closed when ALL of these hold:

1. What the user asked for this time is fully delivered.
2. Nothing waits on the user — a test handed over but not yet reported back counts as waiting.
3. The paired plan, if there is one, is `Done`, and the status-header grep finds no other live plan
   the work belongs to.
4. No `🔴` row is open.
5. No workflow step the rules still require is pending — e.g. the `/wp-module-save-implementation`
   reminder after a feature, not yet given.
6. Nothing started this turn is still running — a background agent, workflow, build or command.

**The block is a tree inside a ` ```text ` fence** (the fence keeps the branch characters aligned).
Each slot is a branch, in the order below; each item under a slot is a leaf. One leaf is one line;
a long item is cut short, never wrapped. A slot with nothing to say is no branch — except
**You now** in the open block, which reads `nothing`.

**The tree is the only place that says what was done.** Text above it carries only what a leaf
cannot: a judgment and its reason the user needs (why something was left out, what a check found).
It never restates a Done leaf. Nothing of that kind → no text above the tree.

**Closed → Done branch + Closed, and stop:**

```text
├─ ✅ Done
│  ├─ <path> (<size>) — <what changed in it, one clause>
│  └─ <path> (<size>) — <what changed in it, one clause>
└─ 🏁 Closed  nothing pending
```

**Any condition fails → the open block:**

```text
├─ ✅ Done
│  ├─ <path> (<size>) — <what changed in it, one clause>
│  └─ <path> (<size>) — <what changed in it, one clause>
├─ ⏳ In progress
│  └─ <what is still running> · <the signal that it finished>
├─ ⚠️ Attention
│  └─ <what needs a human: a manual step, a risk, a surprise, a decision>
├─ 👉 You now
│  └─ <the one action that belongs to the user>
└─ 🔜 Next
   └─ <the one next step or skill, and when it applies>
```

`⏳ In progress` and `⚠️ Attention` branches appear only when they apply (rules below). The last branch uses
`└─` and its leaves hang under three spaces instead of `│`. Every branch is emoji + one space + label;
a new slot emoji comes from U+1F000 and up, never a text-default symbol such as `⏭` (`⚠️` keeps its
emoji variation selector).

- **Never invent a follow-up to fill a slot.** "Consider adding tests", "you could also…", "another
  project could sync this" — if it was not asked for and no rule requires it, it is not a Next.
  A finished task ends with `🏁 Closed`, not with a suggestion.
- **Done** has one leaf per file actually written; a step that wrote no file (a build, a check-in,
  a query run) is a leaf of its own. Nothing written and nothing run → one leaf, `no files changed`.
  A skill that defines its own report lines (e.g. `/wp-module-save-implementation` Step 4) writes
  them as Done leaves, never as a separate block above the tree.
- **Name the file, never replay it.** A document written under `project-memory/` or `.claude/`
  (plan, impl, MODULE.md, flow, TASK.md) is reported as its path plus size — `(+N/−M)` from
  `git diff --numstat`, or `(N lines, new)` when git does not track it — and one clause of what
  changed in it ("status → Done", "placeholder → full map"). Its content stays in the file for the
  user to open; the reply carries no summary of what was written.
- **Highlight only what needs a human.** A manual step, a risk, a surprise, or a decision gets its
  own leaf under the `⚠️ Attention` branch, directly above You now (several → one leaf each). Everything else stays silent.
- **In progress** appears only while work started this turn is still running after the reply.
  Name it and the signal that ends it (a task notification, an exit code). Nothing running → omit
  the branch; never write `In progress: nothing`.
- **You now** is an action only the user can take: test the change, answer an open
  item, review a file, say go. When only Next is pending and it waits on nothing from the user
  → `nothing`.
- **Judge each You now: a choice gets asked, an action stays a line.** The test: does the user
  pick between outcomes you can name?
  - **Yes, a choice** — which name, which approach, one commit or two, supply a reference file or
    go on without it. Print the block, then ask it through `AskUserQuestion` in the same turn,
    per **Question pattern**. Several independent choices go in one call, up to 4 questions.
  - **No, an action only the user can do** — run a `.sql`, test the change, drop a
    file into `references/`, review a file. A plain line: name the action and what to report back.
  - **Both in one stop** — the action stays the line, and the choice goes to the tool.
- **Next** names ONE step: a skill (`/wp-...`) or a workflow step (e.g. "Step 2 act loop, task 1").
  At a fork, name the recommended branch and the condition for the other in the same line. It is
  a reminder, never an action: a user-triggered skill stays user-triggered, and the leaf names the
  full command for the user to type (`Ready to record → type /wp-module-save-implementation`,
  `type /wp-retro`).
- **Stopping blocked or mid-flight** still gets the block: Done says what landed, You now names
  the blocker the user must clear, Next says where work resumes.
- **A plan is live → its `> **Resume:**` line takes You now and Next** in the same turn (see
  **Status header → Resume line**). The reply scrolls away; the plan is what the next session reads.
- **Not at every question.** The block closes a run or a task; a skill mid-interview just asks
  its question.
- **Auto-triggered coding standards add none of their own.** `wp-repository-unitofwork-pattern`,
  `wp-sql-query-design`, `wp-csharp-gof-design-patterns`, and `wp-aspnet-mvc-frontend-standards` apply inside a coding task; that
  task's handoff covers them. `wp-writing-for-agents` likewise applies inside the task that edits a steering file. A dispatcher (`wp-obsidian-start`) defers to the skill it routes to.
- **Language follows the conversation.** The two shapes, their slots, and their order do not change.

## Status header

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

### Resume line — plans and interview records

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

### Values — plans

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

### Values — one-off task records

A task record's line is `Status · Date · Likely to repeat` (`Detail` after `Status` when
`Blocked`): `> **Status:** Done · **Date:** 2026-09-14 · **Likely to repeat:** Monthly`. `Date` is
the day the work happened.

A one-off task has no design step and no slicing, and its record is written once the work stops, so
it carries two values only:

| Status | Detail | Means | Set by |
|---|---|---|---|
| `Blocked` | one line: the reason (required) | Stopped on something external; the record ends where the work stopped | `/wp-task-record` |
| `Done` | — | Finished | `/wp-task-record` |

### Values — interview records

| Status | Detail | Means | Set by |
|---|---|---|---|
| `Interviewing` | `N/6` — `N` = steps of `/wp-interview` completed | The interview is open | `/wp-interview` |
| `Blocked` | one line: the reason (required) | Waiting on something external — material a colleague holds, a decision only someone else makes | `/wp-interview` |
| `Done` | — | Goal confirmed, route written; continuing it reopens it as `Interviewing` | `/wp-interview` |

### Rules that hold for every record

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

## Interview record as input

An interview record (`project-memory/interviews/<file>.md`) arrives attached as `@<path>`,
named by its path, or pasted as text (H1 `# Interview — …`, or `# Idea interview — …` before 15.0.0).
Before the first question, read the files its `Material` table lists too.

- **Its answers are the user's statement** — the sections they settle go straight to confirmation;
  questions go only to what they leave open.
- **`Still unknown` and `Risks` carry over**, each as an open item — a plan's `☐` row, a spec's
  `(TBD — …)`, a task's `If this comes back` line when the work left it open.
- **`Status` other than `Done`** → its goal is not confirmed yet: say so, and offer to finish it
  first with `/wp-interview @<path>`.
- **Name the record** in what the skill writes — its path, or the H1 title of pasted text with no
  file.
