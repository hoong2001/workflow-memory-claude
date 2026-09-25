# Shared skill conventions

Not a skill — a shared reference for the workflow skills in this folder, so one rule used by
several skills has exactly one wording. A skill that names a section below follows it in full;
nothing here overrides a skill's own explicit instruction.

## Question pattern

Every question a discussion skill asks goes through the `AskUserQuestion` tool — never a
plain-text statement waiting for a nod, and never gated behind a rejection first.

1. **Infer, then ask** — work out your recommended answer from the plan, the module docs,
   the code, or the stack constraints, and use it as the first option, marked "(Recommended)".
2. **3 more real alternatives + 1 custom** — the other 3 options must each be a genuine,
   distinct direction with a one-line trade-off, never filler to pad the count.
   `AskUserQuestion`'s built-in "Other" serves as the free-form custom choice.

If `AskUserQuestion` is unavailable in the current environment, fall back to listing the
same 4 options as plain text and asking the user to pick one or state a custom answer —
never revert to a bare statement waiting for a nod.

## Interview conduct

- **One question at a time** — wait for the answer before asking the next.
- **Explore before asking** — if the codebase or the existing docs can answer it, read them
  instead of spending a question on it.

## Handoff

Every skill run ends with a handoff, and so does every task that runs without a skill
(`.claude/rules/workspace-workflow.md` applies it there). It answers what just happened — and,
only when something is still pending, what is the user's to do and what comes after.

**First judge: is the work closed?** It is closed when ALL of these hold:

1. What the user asked for this time is fully delivered.
2. Nothing waits on the user — a build + test reminded but not yet reported back counts as waiting.
3. The paired plan, if there is one, is `Done`, and the status-header grep finds no other live plan
   the work belongs to.
4. No `🔴` row is open.
5. No workflow step the rules still require is pending — e.g. `/wp-module-save-implementation`
   after a feature, or the `/wp-obsidian-progress-log` reminder at Step 3 wrap-up, not yet given.

**Closed → two lines, and stop:**

```
✅ Done: <what changed, one line> · <every file written, project-root-relative>
🏁 Closed — nothing pending.
```

**Any condition fails → the open block:**

```
✅ Done: <what changed, one line> · <every file written, project-root-relative>
👉 You now: <the one action that belongs to the user>
⏭ Next: <the one next step or skill, and when it applies>
```

- **Never invent a follow-up to fill a slot.** "Consider adding tests", "you could also…", "another
  project could sync this" — if it was not asked for and no rule requires it, it is not a Next.
  A finished task ends with `🏁 Closed`, not with a suggestion.
- **Done** lists the files actually written. Nothing written → `no files changed`. A skill with
  its own report block (e.g. `/wp-module-save-implementation`'s ✅ list) uses that block as the
  Done slot and adds the lines below it.
- **You now** is an action only the user can take: build + test in Visual Studio, answer an open
  item, review a file, say go. When only Next is pending and it waits on nothing from the user
  → `nothing`.
- **Next** names ONE step: a skill (`/wp-...`) or a workflow step (e.g. "Step 2 act loop, task 1").
  At a fork, name the recommended branch and the condition for the other in the same line. It is
  a reminder, never an action: a user-invoked skill stays user-invoked.
- **Stopping blocked or mid-flight** still gets the block: Done says what landed, You now names
  the blocker the user must clear, Next says where work resumes.
- **Not at every question.** The block closes a run or a task; a skill mid-interview just asks
  its question.
- **Auto-triggered coding standards add none of their own.** `wp-concrete-repository-pattern`,
  `wp-sql-query-design`, and `wp-aspnet-mvc-frontend-standards` apply inside a coding task; that
  task's handoff covers them. A dispatcher (`wp-obsidian-start`) defers to the skill it routes to.
- **Language follows the conversation.** The two shapes, their slots, and their order do not change.

## Status header

Every plan (`project-memory/modules/<name>/plans/<name>-<date>-<slug>.md`) and every one-off task
record (`project-memory/tasks/<date>-<slug>/TASK.md`) opens with ONE line directly under its H1:

```markdown
# <title>

> **Status:** Building 2/5 · **Updated:** 2026-09-07
```

`Status` names the last thing that actually happened to the document — which step the work stopped
at, not merely that it stopped.

### Values — plans

| Value | Means | Set by |
|---|---|---|
| `Planned` | The plan exists; nothing else has happened | `/wp-module-plan-discuss` |
| `Designed` | `## Technical Design` + `## Tasks` sections have been appended | `/wp-module-technical-design` |
| `Building` | Code has started; this plan has no `## Tasks` table | the Step 2 act loop |
| `Building N/M` | Code has started on a sliced plan — `N` = `☑` rows, `M` = total rows | the Step 2 act loop |
| `Blocked: <one line>` | Stopped on something external, or an open `🔴` row in `## Decisions & open items` | whoever hits the blocker |
| `Done` | Finished | `/wp-module-save-implementation` |

The `N/M` counter appears **if and only if** the plan has a `## Tasks` table, and is always
recomputable from that table's `☑` marks — so a stale count self-corrects on the next read instead
of contradicting the table. A plan that builds in one pass has nothing to count and is simply
`Building`.

### Values — one-off task records

A one-off task has no design step and no slicing, so it carries three values only:

| Value | Means | Set by |
|---|---|---|
| `Doing` | The work is live; the Request section is written, the rest is not | `/wp-task-record` |
| `Blocked: <one line>` | Stopped on something external | whoever hits the blocker |
| `Done` | Finished | `/wp-task-record` |

### Rules that hold for both

- **Whoever appends a section to the document sets `Status` to their own value** — no exceptions
  to remember.
- **Keep it on ONE line in that exact shape.** Unfinished work is found by scanning headers, never
  by opening every file, and a scan that has to parse variations is a scan that silently misses
  work:
  ```bash
  grep -H "^> \*\*Status:\*\*" project-memory/modules/<name>/plans/*.md
  grep -H "^> \*\*Status:\*\*" project-memory/tasks/*/TASK.md
  ```
- **`Updated` is the date this header last changed**, not the date the document was written.
  (A task record carries `**Date:**` — the day the work happened — instead.)
- **The document is the single source of truth for its own progress.** No other file carries a
  copy, so there is nothing to drift.
