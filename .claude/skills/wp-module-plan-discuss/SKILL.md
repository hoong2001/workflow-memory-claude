---
name: wp-module-plan-discuss
description: Talk a module-level requirement into a work-ready plan document - the ONLY on-ramp for module work docs. Adaptive depth via five-element gap detection (Goal, Background, Material, Boundary, Definition of Done) against module docs and real code. Entry requires the user to state a purpose/goal first. Lands plans/<name>-<date>-<slug>.md in the target module. Use whenever a module-level task needs a plan before coding. Do NOT use for a whole-system spec (/wp-system-spec-discuss), or when a plan already exists and what is missing is the technical cut or the task breakdown (/wp-module-technical-design).
---

<what-to-do>

Converge a stated module-level requirement into a work-ready plan in the module's `plans/` folder. The flow is always: **goal stated → infer & reason → AskUserQuestion (recommended + 3 alternatives + 1 custom) → interview only the gaps → confirm → write the plan.** Depth is never chosen up front — it emerges from how many gaps and conflicts the detection pass finds.

**Entry requirement — no goal, no session.** The user must state a purpose / goal / requirement before this skill does anything. If it is missing, ask for it in one line and wait. Do not guess a goal on the user's behalf.

**Detection over judgment.** Never classify the requirement as "clear" or "fuzzy" by impression. Instead, test each of the five elements individually (Step 2): an element is CLEAR only if it can be filled from the user's statement + module docs + code AND survives a contradiction check; otherwise it is a GAP. The gap list — not a vibe — decides how deep the session goes.

**Question pattern** (always via `AskUserQuestion`: recommended answer + 3 alternatives + 1
custom) and **interview conduct** (one question at a time; explore before asking): follow
`.claude/skills/_shared-conventions.md`.

**Order decisions parent-first.** When one decision depends on another (the choice of storage shape depends on whether a value is nullable; the API shape depends on the chosen boundary), settle the parent before the child — never ask a downstream question while its upstream is still open, or the answer may not survive the parent's resolution. Walk the plan as a tree of decisions, resolving the dependencies in order.

</what-to-do>

<supporting-info>

## Step 0 — Preconditions

- **Goal stated?** If the user has not provided a purpose / goal / requirement, ask for it and stop until it arrives.
- **Hard rules loaded** — `project-memory/stack-architecture.md` is non-negotiable; every inference and option must already respect it.
- **Target module identified** — if ambiguous, resolve it first (Module Map in root `CLAUDE.md`).

## Step 1 — Evidence before questions

Read the target module's memory BEFORE asking anything: `MODULE.md` (local conventions + known gotchas), `<name>-flow.md`, recent `impl/` records (prior decisions that constrain this task), `schema/` and `references/` if relevant, and the real code around the suspected cut point. Most "questions" die here — the docs or the code already answer them.

If the code is unfamiliar and no flow doc exists, route through `/wp-module-code-trace-flow` first to extract the flow, then come back.

## Step 2 — Five-element gap detection

Test each element against (user statement + docs + code):

| Element | CLEAR when... |
|---|---|
| **Goal** | the what + why is stated or follows unambiguously |
| **Background** | the current behavior / trigger is known from docs, code, or the statement |
| **Material** | the inputs (files, tables, schemas, references) are identified |
| **Boundary** | what is out of scope is explicit or safely inferable |
| **Definition of Done** | a verifiable done-criterion can be written down |

An element is a **GAP** if it cannot be filled (blank) or if filling it contradicts `MODULE.md` rules, known gotchas, a prior `impl/` decision, the flow doc, or the actual code (conflict). Also sharpen terminology here — if the user's words and the module's documented terms diverge, flag it now.

## Step 3 — Converge (the gap list drives the depth)

- **All five CLEAR, cut point obvious** → present the filled five elements + the cut point in one block for a **single confirmation**. This is the trivial-fix fast path — still a confirmation, never a silent assumption.
- **Element fillable but conflicting** → challenge exactly that point, quoting the doc or code it collides with ("MODULE.md says times here are UTC, but your plan formats them in the repository layer — which is it?"). Resolve with the question pattern (infer, then `AskUserQuestion` with 4+1).
- **Element blank** → interview ONLY the blank elements, one at a time, with the question pattern.

Mixed results are normal: two blanks + one conflict = two interview questions + one challenge. Loop until all five are CLEAR and conflicts are zero.

**Shared-symbol check before writing.** If the cut point lands on a shared symbol (`Base*`, `ConstValues/`, `Results/`, or anything with more than one caller), the plan is also changing every other caller — the five elements can all read CLEAR while this stays invisible. Read the fan-in table in `<name>-flow.md`; if it is missing or stale, run `/wp-module-code-trace-flow` Step 3.5 before confirming. List the affected callers in the plan: an unstated blast radius is the plan's largest silent decision.

**Implicit-decision sweep before writing.** The five elements reading CLEAR does not prove every call has been made — a downstream decision can still sit silently assumed. Before the final confirmation, sweep once: "what has this plan quietly decided without saying so?" (error handling, an edge case, a default value, a boundary the user never named). Surface each one with the question pattern until nothing important is left implicit. Then do a final confirmation of the assembled plan.

**Log every item the moment it is raised.** Each question asked, conflict challenged, implicit
decision surfaced, or item parked becomes one row in the plan's `## Decisions & open items` table
(Step 4) as it happens — not reconstructed at the end. A settled row carries the answer + why and
a `☑`; an unsettled one carries what it waits on, a `☐`, and a `🔴`/`🟢` saying whether the build
can start without it — judge that at the moment you park it, not on build day. An item that lived only in the chat is
gone when the session ends, and the next session re-argues it from zero.

## Step 4 — Write the plan and hand off

Save to `project-memory/modules/<name>/plans/<name>-<date>-<slug>.md` — same naming as the future paired `impl/` record (written by `/wp-module-save-implementation` at wrap-up).

**Open the file with the status header — one line, always, directly under the H1:**

```markdown
# <module> — <short title>

> **Status:** Planned · **Updated:** YYYY-MM-DD
```

`Status` names the last thing that actually happened to this plan:

| Value | Means | Set by |
|---|---|---|
| `Planned` | The plan exists; nothing else has happened | this skill |
| `Designed` | `## Technical Design` + `## Tasks` sections have been appended | `/wp-module-technical-design` |
| `Building` | Code has started on a plan with no increments table | the Step 2 act loop |
| `Building N/M` | Code has started on a sliced plan — `N` = `☑` rows, `M` = total rows | the Step 2 act loop |
| `Blocked: <one line>` | Stopped on something external | whoever hits the blocker |
| `Done` | Finished | `/wp-module-save-implementation` |

One rule, no exceptions: **whoever appends a section to the plan sets `Status` to their own
value.**

The `N/M` counter appears if and only if the plan has a `## Tasks` table, and it is always
recomputable from that table's `☑` marks — so a stale count self-corrects on the next read
instead of contradicting the table. `/wp-module-technical-design` always writes that table, so a
plan that went through it always carries a counter; a trivial fix taken straight from here to
code has no table and is simply `Building`.

`Updated` is the date this header last changed, not the date the plan was written.

The header exists so a new session finds unfinished work with one `grep` instead of opening every plan (`workspace-workflow.md` Step 2 Branch A). Keep it on ONE line in this exact shape — a scan that has to parse variations is a scan that silently misses work.

### Output template — the plan's fixed shape

Write the body in these sections, in this order. Tables over prose: a reader must see the goal,
what gets touched, and what is still open within one screen, without parsing paragraphs. **Rows
scale with content, sections do not** — a trivial fix has one row per table; a complex task has
twenty. Drop a section only when it is genuinely empty, and say so in one line rather than leaving
a blank heading. Use project-root-relative paths only (see `workspace-doc-relative-paths.md`).

```markdown
# <module> — <short title>

> **Status:** Planned · **Updated:** YYYY-MM-DD

## Goal
<what + why, in one or two lines — a reader who opens this cold knows what they are building>

## The five elements

| Element | Filled with |
|---|---|
| Background | the current behavior / trigger this changes |
| Material | inputs: files, tables, views, references, schemas |
| Boundary | what is explicitly OUT of scope |
| Definition of Done | the verifiable criterion the USER checks after building |

## Touch points — what changes where

| File / object | New or Modified | What changes |
|---|---|---|
| `path/relative/to/root.cs` | Modified | one line, concrete |

## Decisions & open items

| # | Item | Decision + why | Status | Blocks build |
|---|---|---|---|---|
| 1 | <the question that was on the table> | <what we chose, and why that over the alternative> | ☑ Resolved | — |
| 2 | <still on the table> | — | ☐ Open — waiting on <who / what> | 🔴 |
| 3 | <a later-phase call, safe to build without> | — | ☐ Open | 🟢 |
| 4 | <belongs to the technical cut> | — | → `/wp-module-technical-design` | 🟢 |
```

Three rules make these tables worth their ink:

- **`Goal` appears once, above the table** — the five-element table carries the other four, so
  nothing is written twice.
- **Touch points is the coarse cut, not the design.** File + one line of what changes, as far as
  the evidence in Step 1 actually supports. The exact class/method map, the API surface and the SQL
  belong to `/wp-module-technical-design`'s `## Class & file map`; this table is the honest
  first-pass blast radius, including the shared-symbol callers found above, and that skill refines
  it rather than repeating it. A caller you know is affected goes in a row — an unstated blast
  radius is the plan's largest silent decision.
- **Every ☐ is a landmine with a name.** `Status` is one of `☑ Resolved`, `☐ Open — waiting on
  <who/what>`, or `→ <the skill/step that owns it>`. This framework has no ADR layer, so a
  resolved row IS the decision record — the `Decision + why` cell must survive without the
  conversation that produced it ("what" is reconstructable later; "why this over that" is lost
  forever if unwritten).

**`Blocks build` is the column that gets read first**, so it carries a mark, not a sentence:
`🔴` = coding cannot start until this row is `☑`; `🟢` = open, but the build proceeds without it;
`—` = already resolved, nothing to weigh. Every `☐` row gets one of the two marks — an open item
whose cost nobody judged is exactly the item that surfaces on build day.

**No coding starts while a `🔴` row is open.** Either resolve it first, or set the status header to
`Blocked: <that item>` so the plan announces it instead of hiding it behind `Planned`. `🟢` rows
stay open and the work proceeds around them.

If the technical cut (API / classes / SQL / frontend) or the build order still needs nailing down, route to `/wp-module-technical-design` — it appends BOTH a "Technical Design" and a "Tasks" section to this SAME plan file, slicing into vertical increments when the feature needs it.

**Sizing check — does this need slicing?** After the plan is written, judge whether it builds in a single code→build→test pass. It does NOT (so suggest slicing) when the plan shows any of: multiple independent user-facing behaviors, a full new page/flow spanning several layers end-to-end, or a wide refactor whose blast radius hits many call sites. When it clearly builds in one pass (a trivial fix, one field, one method), say nothing. When it's borderline or clearly too big, add ONE reminder line — never auto-run it, the trigger is the user's:

> "This looks like more than one build pass — run `/wp-module-technical-design` to nail the cut and break it into ordered vertical increments first?"

</supporting-info>
