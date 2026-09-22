---
name: wp-task-record
description: Record a one-off task that belongs to no module - a report run once, a data patch, an ad-hoc investigation, a file conversion - into its own isolated folder under project-memory/tasks/, together with the .sql it used and the material it was given. Use when the work produces a one-time artifact for a person and leaves no code, view, or schema behind in the system, or when the user says "record this task", "記低呢單嘢", "呢個唔關 module 事". Do NOT use when the system keeps something afterwards (that is module work - /wp-module-plan-discuss then /wp-module-save-implementation), and never auto-run it - the trigger belongs to the user.
---

# Task Record

The module layer assumes the system keeps what you built. A one-off report does not fit:
there is no module to plan against, no flow to trace, no implementation to record. This
skill is the whole memory path for that kind of work — one folder, one file, done.

## Step 0 · Confirm it really is a task, not module work

Ask one question: **does the system keep anything after this is done?**

| Answer | Route |
|---|---|
| Code, a view, a screen, a schema change ships into the system | **Stop.** This is module work → `/wp-module-plan-discuss` |
| The output is a one-time artifact handed to a person — a spreadsheet, a number, an answer | Continue here |

Borderline cases and how they resolve:

- *"A one-off query, but I saved the view into the database"* → the database keeps it →
  module work.
- *"A data patch UPDATE run once in production"* → nothing persists but the data itself →
  task. The `.sql` is the deliverable.
- *"A report they say they'll want monthly"* → still a task until someone builds it a
  screen. Record it, and say so in **If this comes back**.

If the answer is genuinely unclear, ask the user rather than guessing — the wrong folder
buries the record where nobody looks for it.

## Step 0.5 · Check for a prior task before starting

Tasks have no module `plans/*.md` to grep, but the same idea from `workspace-workflow.md`
Branch A applies: before creating a fresh folder, check whether this request already has a
home under `project-memory/tasks/`.

```bash
grep -li "<keyword from the request>" project-memory/tasks/*/TASK.md
```

Also scan the folder-name slugs directly — a request phrased differently can still be the
same recurring report a slug like `q2-sales-report` already covers.

Found a candidate → open its `TASK.md` and route by its status line:

| Match's Status | This request | Route |
|---|---|---|
| `Doing` / `Blocked: ...` | any | **Same unfinished task** — resume that folder, don't create a new one |
| `Done` | wording says or implies "again" / "monthly" / "same as last time" | **Continuation** — new dated folder as usual, but pull the old `## If this comes back` notes forward as the starting point, and open the new `## Request` section with `Continues: project-memory/tasks/<old-folder>/TASK.md` |
| `Done` | superficially similar but actually a different ask | **Genuinely new** — say so in one line ("looks different from `<old task>` because X — treating as new") so the user can correct you, then continue |

Ambiguous which row applies → don't guess. Ask via `AskUserQuestion` (pattern in
`.claude/skills/_shared-conventions.md`): infer the likely answer as the recommended option,
e.g. "呢單嘢係咪延續 `<old task title>` (`<old date>`)?"

No candidate found → this is new. Continue to Step 0.6.

## Step 0.6 · Clarify the goal before starting

A one-off request stated in one line often hides an ambiguous "why" — and the wrong "why"
produces a technically-correct answer to the wrong question. Before touching any file, check:
does the request's purpose (what + why) already read unambiguously from what the user said?

- **Already clear** (e.g. "pull the list of active stockists for the audit team") → skip this
  step silently. Not every task earns a question.
- **Ambiguous or open to more than one reading** (e.g. a date range not stated, "the sales
  report" when more than one could match, a patch whose intended scope could be narrow or
  broad) → ask ONE question via `AskUserQuestion`, following the question pattern in
  `.claude/skills/_shared-conventions.md` (infer a recommended reading + 3 real alternatives +
  custom). Resolve it before Step 1 — don't let an assumed "why" ride silently into the SQL.

The answer becomes the `## Request` section in Step 3 directly — no re-deriving it later.

## Step 1 · Create the task folder

```
project-memory/tasks/<YYYY-MM-DD>-<slug>/
```

- Today's date, `<slug>` short kebab-case naming the request: `2026-09-14-q3-sales-report`.
- Create `schema/` and `references/` inside it **only when there is something to put in
  them**. Never scaffold empty folders.
- If a folder for this same request already exists, update it — do not create a second one.

## Step 2 · Land every file the task touched

Conventions match the module layer, so nothing new to learn:

| What | Where | Rule |
|---|---|---|
| Any `.sql` — the query that produced the report, the patch UPDATE, a test script | `schema/` | A described script is not a delivered script. Ship the real file. Name it `<date>-<slug>.sql`. |
| Material received — spec, email text, screenshot, sample file | `references/` | Consulted on demand, never auto-loaded. |
| The output itself (the Excel, the PDF sent to the requester) | usually NOT stored | Say in `TASK.md` where it went ("emailed to <role> on <date>"). Store it only if it is small and genuinely needed for comparison next time. |

Two standing rules apply unchanged and are easiest to break here:

- **Credentials** — an ad-hoc `.sql` is the classic place a live connection string gets
  pasted. Placeholder only; name where the real value lives
  (`.claude/rules/workspace-no-secrets.md`).
- **SQL design** — the `wp-sql-query-design` standard governs this query too. One-off is
  not a licence for `SELECT *` or a query nobody can read six months later.

## Step 3 · Write `TASK.md`

Write to `project-memory/tasks/<YYYY-MM-DD>-<slug>/TASK.md`:

```markdown
# Task: <one line — what was asked for>

> **Status:** Done · **Date:** YYYY-MM-DD · **Likely to repeat:** Yes / No / Monthly

## Request
Who asked, what they asked for, and **why they need it** — the purpose is mandatory here
for the same reason it is in a module plan: next time the request arrives slightly
different, the purpose says whether the old query still answers it.

## What was done
The actual steps, in order. Enough for a future session to redo it without the conversation.

## Deliverables
| File / output | What it is |
|---|---|
| `schema/2026-09-14-q3-sales-report.sql` | The query that produced the numbers |
| Excel workbook | Emailed to the requester 2026-09-14; not stored here |

## Decisions + why
Only the judgment calls — which date field counts as the sale date, which statuses were
excluded, what the requester meant by an ambiguous word. Skip the section if there were none.

## If this comes back
The section that pays for this folder: what to re-run, the first thing to change (usually
the date range), and anything that tripped you up. Write it for someone with no memory of
today.
```

The header line follows the **Status header** section of `.claude/skills/_shared-conventions.md`
(same one-line shape and same grep as a module plan) — read it there rather than from here. Two
things are specific to a task record: its values are only `Doing` / `Blocked: <why>` / `Done`, and
it carries `**Date:**` (the day the work happened) where a plan carries `**Updated:**`.

Invoking this skill at the START of a task is fine — write the Request section, set `Doing`, and
fill the rest when you land.

## Step 4 · Report, then stop

```
✅ Task recorded: project-memory/tasks/2026-09-14-q3-sales-report/TASK.md
✅ Query saved:   .../schema/2026-09-14-q3-sales-report.sql
   Status: Done · Likely to repeat: Monthly
```

Then stop. Deliberately NOT part of this path:

- No implementation record — `impl/` is the module layer's, and no module changed.
- No `flow.md`, no `MODULE.md` gotchas, no Module Map row in `CLAUDE.md`.
- No overview judgment — a one-off report never changes the system's WHAT.

The one optional follow-on: if the task was substantial enough that a future you would
wonder where the week went, remind the user in one line that `/wp-obsidian-progress-log`
can note it on the cross-project card. Their trigger, never automatic.
