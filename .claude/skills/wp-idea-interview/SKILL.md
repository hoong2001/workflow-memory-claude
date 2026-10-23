---
name: wp-idea-interview
description: Interview a raw idea — a spark, a want, an "if only we had…" — into one confirmed goal, then route it to the skill that builds it. Use when the user has an idea but no requirement yet, or does not know where to start (靈感, 不知道怎麼開始). A stated module goal → /wp-module-plan-discuss.
---

<what-to-do>

Run a **funnel**: spark → want → purpose → goal. The session is done when the user has confirmed one
**goal sentence** — who, what result, how success is measured — and you have named the route with
the exact command to type.

**Facts are yours, decisions are the user's.** Before spending a question, look in the repo,
`project-memory/` (Module Map, `MODULE.md` files, overview, plans, tasks) and any material the user
supplied.

**Every question goes through `AskUserQuestion`**, open ones included — the **Question pattern** in
`.claude/skills/_shared-conventions.md`. Offer 2–4 starter options inferred from what you can observe
(the systems and modules this project holds, past plans and tasks); the free answer goes in Other.
Mark an option Recommended only when you can name its evidence.

**Pace by the frontier.** One question at a time until the *what* is settled — each early answer
reshapes the next question. After that, rounds of up to 3 questions, each answerable on its own; a
question that depends on an open one waits for the next round. One question is a full round.

1. **Open** — ask where the idea came from: a repeated pain, an "if only we had…", something seen
   elsewhere.
2. **Find the what** — narrow by kind, then domain, then the thing itself. Done when you can state in
   one line what it is.
3. **Ask for material** — see **Material**. Done when the user has supplied it or said there is none.
4. **Steer to the goal** — draw from the **Question pool** only what the goal sentence still lacks.
   Done when purpose, users, and a success measure with its baseline are known.
5. **Confirm** — one round: the goal sentence assembled from the answers, the success baseline, the
   deadline. Done when the user confirms the sentence.
6. **Route** — pick the row in **Route**, mark the record `Done`, and close with the handoff
   (**Handoff** in `.claude/skills/_shared-conventions.md`): Done = the record path; You now = the
   command to type; Next = the skill after it.

Write the record from the first answer on — see **The record**.

</what-to-do>

<supporting-info>

## Question pool

| Dimension | What it settles |
|---|---|
| Kind | new system · change to an existing module · one-off output · change to how Claude works here · not software |
| Who | the users, and who decides |
| Feeling | fuzzy, eager, anxious — ask when pace or scope is in doubt; fuzzy → smaller steps, more inferred options |
| Purpose | the one main problem it removes — one pick, the rest ranked below it |
| Today | how the work is done now |
| Systems | what it replaces, what it connects to |
| Success | how we know it worked, and the number today |
| When | the deadline — it sizes the first slice |

## Recovering a stuck interview

- Two option sets miss in a row → say the options were guesses and invite a few words in Other.
- An answer contradicts an earlier one → ask which holds; record the earlier answer as superseded.

## Material

Ask once the *what* is settled. Name the kinds: reference documents, diagrams, meeting summaries,
flowcharts, screenshots, sample data, `.sql` scripts. Options such as "files are in a folder I will
name", "a summary in Other", "none yet". Read what arrives before the next question — every fact it
answers is a question dropped.

Until the route is known, files stay where the user put them; the record lists each path. At Route,
name the folder each one belongs in per Step 1 of `.claude/rules/workspace-workflow.md`, and move them
on the user's yes.

When the user describes a sequence of steps, draw it as a Mermaid `flowchart` in the record and ask
whether it matches.

## The record

`project-memory/interviews/<name>-<date>-<slug>.md`. `<name>` is the module or system the idea lands
in, `idea` until known; rename the file once, when the route settles. Update it after every answer.
English, per `.claude/rules/workspace-doc-writing-style.md`.

```markdown
# Idea interview — <working title>

> **Status:** Interviewing · **Updated:** YYYY-MM-DD

## Goal
<the confirmed goal sentence; until Step 5, "Not settled" plus what is known>

## Answers
| # | Question | Answer |
|---|---|---|

## Material
| Item | Where it is now | Belongs in |
|---|---|---|

## Flow
<Mermaid flowchart — only when the user described a sequence>

## Risks
<scope that does not fit the deadline, with the slice that does; assumptions nothing confirms>

## Route
<numbered steps with the exact commands>

## Still unknown
<each open point, and who or what settles it>
```

`Status` is `Interviewing` while open and `Done` once the goal is confirmed and routed. An empty
section keeps its heading with one line saying why.

## Route

| The goal lands as | Route |
|---|---|
| A brand-new system | `/wp-system-spec-discuss` → `/wp-system-overview-spec-generator`, then each module through `/wp-module-plan-discuss` |
| A change to an existing module, code location known | `/wp-module-plan-discuss` |
| A change to an existing module, location unknown | `/wp-module-code-trace-flow`, then `/wp-module-plan-discuss` |
| A one-off output — the system keeps nothing | do the work, then `/wp-task-record` |
| A change to how Claude works here (skill, rule, hook) | name the lightest form that meets the goal; `wp-writing-for-agents` governs the edit |
| Not software | one first step that fits in 15 minutes; no skill |

Pass the record to the next skill as its argument, e.g.
`/wp-module-plan-discuss project-memory/interviews/<file>.md`.

</supporting-info>
