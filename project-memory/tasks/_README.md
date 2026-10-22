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

## What a task folder holds

Each task is one self-contained folder, `<YYYY-MM-DD>-<slug>/`: its `TASK.md` record, plus
`schema/` for the `.sql` it used and `references/` for the material it was given, when it had
any. Two tasks never share a file. When a request comes back, open the old `TASK.md` at
**"If this comes back"**: what to re-run, what to change first, what tripped someone up.

`/wp-task-record` creates the folder and writes `TASK.md`; the folder layout and the record's
format are defined in that skill.

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
