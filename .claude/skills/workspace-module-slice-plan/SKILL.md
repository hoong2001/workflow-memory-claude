---
name: workspace-module-slice-plan
description: Slice a confirmed plan into ordered vertical increments (tracer bullets) — each a thin path through every layer (Web → Services → UnitOfWork → SQL + frontend) that is independently demoable and verifiable, with explicit blocking order — appended as a "Build Increments" section to the SAME plan document in the module's plans/ folder. Use when a plan describes a feature too big to build in one code→build→test pass and you want it broken into increments you can verify one at a time. Do NOT use for a trivial fix (plan-discuss's fast path already covers it), or before a plan exists (run /workspace-module-plan-discuss first).
---

<what-to-do>

Take a confirmed plan and cut it into an ordered list of **vertical increments**, then append that list to the same plan file. The plan owns the WHAT; this skill decides the ORDER in which the WHAT gets built so each step lands green and verifiable on its own.

## Step 1: Locate and absorb the inputs

1. **The plan** — the user names it, otherwise take the most recent file in the target module's `plans/`. If none exists, stop and route to `/workspace-module-plan-discuss`. If a `## Technical Design` section is present, slice against it; if not, that's fine — see the just-in-time note in Step 3.
2. **Module memory** — read `.claude/modules/<name>/MODULE.md` (conventions + gotchas), `<name>-flow.md`, `schema/`, and skim `impl/` for prior decisions that constrain the order.
3. **Hard rules** — the layering and forbidden patterns in `.claude/workspace-project-stack-architecture.md` define what "a path through every layer" means for this stack; they are non-negotiable.

## Step 2: Vertical, not horizontal — the one rule everything turns on

A **horizontal** slice ships one layer of the change — all the Repository methods, or all the views — and nothing works until every layer lands. A **vertical** slice (the tracer bullet) ships one narrow path through *every* layer at once — one Controller action → one Service method → one Repository query → the SQL → the one view that shows it — so it can be built, then manually built + tested, and demoed the moment it's done.

Slice by **behavior**, never by layer. "Show the customer list" (a full thin path) is an increment; "write all the repositories" is not.

**Prefactor first.** "Make the change easy, then make the easy change" — if any groundwork (a new shared Result class, a menu/permission slot, a schema tweak) makes the later slices trivial, order that groundwork as the first increment(s).

## Step 3: Order by blocking, quiz before writing

- Each increment declares **Blocked by:** the increments that must land first (blockers-first ordering). List the blocking one earlier in the sequence.
- This project is single-developer with **manual build/test** (see `workspace-workflow.md` Step 2): increments are worked **top-to-bottom, one at a time, in the loop** — build one, remind the user to build + test it, fix, then start the next. There is no parallel fleet; the blocking edges just fix the order.
- **Just-in-time design** — if the plan has no `## Technical Design` yet, you do NOT need to design the whole feature up front. Slice first, then run `/workspace-module-technical-design` per increment as you reach it. Slicing first is often what keeps a big up-front design from over-reaching.
- **Quiz the user before finalizing** — walk the proposed breakdown with them using the standard question pattern (infer a recommended slicing first with reasoning; on rejection, 4 concrete alternatives + 1 custom via AskUserQuestion). Confirm granularity, the blocking edges, and anything to merge or split. Don't publish the list until it's agreed.

## Step 4: Append the increments to the plan

When the breakdown has converged, append a `## Build Increments` section to the SAME plan document (`plans/<name>-<date>-<slug>.md`) — never a separate file, so the plan/impl pairing stays one-to-one. Use the template below and project-root-relative paths only (see `workspace-doc-relative-paths.md`).

Stop after the list is confirmed. Building each increment starts only on the user's go, and each one runs through the normal Step 2 work loop (code → build → test → save).

</what-to-do>

<supporting-info>

## The wide-refactor exception

One shape breaks the vertical-slice rule: a **wide refactor** — a single mechanical change (rename a shared column, retype a symbol used everywhere) whose blast radius fans across the whole codebase, so one edit breaks hundreds of call sites at once and no thin vertical slice can compile green. Slice it as **expand → migrate → contract** instead:

1. **Expand** — add the new form beside the old so nothing breaks yet.
2. **Migrate** — move call sites over in batches sized by blast radius, one increment per batch; the build stays green throughout because the old form still exists.
3. **Contract** — delete the old form once no caller remains.

## Output template (appended section)

```markdown
## Build Increments

> Sliced: YYYY-MM-DD · derived from the plan above · worked top-to-bottom, one at a time

| # | Increment (one demoable behavior) | Layers touched | Blocked by | Done when (verifiable) |
|---|-----------------------------------|----------------|-----------|------------------------|
| 1 | ... | e.g. SQL + Repository + Service + Controller + View | — | ... |
| 2 | ... | ... | #1 | ... |

### Notes
- Prefactor / groundwork ordered first: ...
- Wide-refactor increments (if any) follow expand → migrate → contract: ...
```

## Guardrails

- Every increment must be a **full vertical path** that can be manually built, tested, and demoed on its own. If a proposed increment can't be verified until a *later* one lands, it's a horizontal slice in disguise — re-cut it.
- Keep each increment at behavior level, not a task checklist — the HOW per increment belongs to `/workspace-module-technical-design`, the code to the work loop.
- Don't over-slice: a feature that genuinely builds in one pass needs no increments — say so and stop rather than manufacturing ceremony.
- New gotchas or conventions discovered while slicing → backfill the module's MODULE.md immediately (one line each).

</supporting-info>
