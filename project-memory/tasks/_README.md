# `tasks/` — one-off work that belongs to no module

Work that the system does not keep: a report run once, a data patch, an ad-hoc
investigation, a file conversion for someone. No module gains or loses code, so there is
nothing to plan, nothing to trace, and no implementation record to write — but the query,
the material, and the reasoning are still worth keeping, because this kind of request
comes back.

## The test — module work, or a task?

**Does the system keep anything after this is done?**

- **Yes** — code, a view, a screen, a schema change ships into the system → module work.
  Go to `project-memory/modules/<name>/` and the normal Step 2 loop.
- **No** — the output is a one-time artifact handed to a person (a spreadsheet, a number,
  an answer) → a task. It lives here.

A task that later becomes permanent (the one-off report gets its own screen) turns into
module work at that moment: create the module, and drop this task folder's `.sql` and
material into that module's `references/` and `schema/`. The task record stays where it
is as the origin story.

## Layout — one folder per task, isolated

```
project-memory/tasks/
├── _README.md                          ← this file (the only committed one)
└── <YYYY-MM-DD>-<slug>/                ← one task, self-contained
    ├── TASK.md                         ← the record (mandatory)
    ├── schema/                         ← any .sql this task used or produced (on demand)
    └── references/                     ← material received: spec, screenshot, sample (on demand)
```

- `<slug>` is short kebab-case, naming the request: `2026-09-14-q3-sales-report`.
- `schema/` and `references/` are created only when there is something to put in them.
  Do not scaffold empty folders.
- Everything a task touches stays inside its own folder. Two ad-hoc report requests
  never share a file.

## Writing the record

`/wp-task-record` writes `TASK.md` and owns its format. Invoke it at whatever point you
reach for it — starting the task (requirement captured, `Status: Doing`) or finishing it
(`Status: Done`). Same file either way.

The section that pays for this folder's existence is **"If this comes back"**: what to
re-run, what to change first, what tripped you up.

## Not committed to git

`.gitignore` excludes everything here except this file. Task records hold real business
data — report queries, customer names, sample output — and this workspace is a public
template repo. They still sync with the drive, so a future session on another machine
finds them.

Flip it per project if the repo is private and you want them versioned: remove the
`project-memory/tasks/` block from `.gitignore`.

## Credentials

The no-secrets rule applies here in full (`.claude/rules/workspace-no-secrets.md`), and
the `PreToolUse` hook is watching. An ad-hoc `.sql` is exactly where a live connection
string tends to get pasted. Write the placeholder and name where the real value lives.
