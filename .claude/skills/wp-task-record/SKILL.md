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

Rules on the header line:

- Keep `> **Status:** ...` on ONE line in that exact shape — it is grep-able the same way
  plan headers are:
  `grep -H "^> \*\*Status:\*\*" project-memory/tasks/*/TASK.md`
- `Status` is `Doing` while the work is live, `Done` when finished, `Blocked: <why>` when
  it stopped on something external. Invoking this skill at the start of a task is fine —
  write the Request section, set `Doing`, and fill the rest when you land.

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
