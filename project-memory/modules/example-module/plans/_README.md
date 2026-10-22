# plans/ — pre-change plans

Before touching this module, drop a plan here first, then act.
- Produced by: `/wp-module-plan-discuss` (state the goal; five-element gap detection scales the discussion — clarify blanks, challenge conflicts, then persist).
- Optionally deepened by: `/wp-module-technical-design` — appends a "Technical Design" section (API / classes / patterns / SQL / frontend, at cut level) AND a "Tasks" section to the SAME plan file before coding starts. Tasks are vertical increments when the feature is too big for one build pass, plain steps when it is not; increments spanning several layers carry a `Wave` column so subagents can write one wave at once.
- Naming: `<name>-<date>-<slug>.md` (module-name prefixed), e.g. `orders-2026-06-23-add-login.md`.
- Pairs with the same-named file in `impl/`: left = "how I plan to do it", right = "how it was actually done".

## Plan shape — tables, not prose

`/wp-module-plan-discuss` writes every plan in one fixed shape (template in that skill's Step 4):
`## Goal` → `## The five elements` → `## Touch points — what changes where` → `## Decisions & open
items`. The point is a one-screen scan: what we're building, which files it hits, and what is still
un-decided.

The last table is the one that earns its keep. Every item raised during the discussion lands there
as a row the moment it is raised — `☑ Resolved` with the decision + why, `☐ Open — waiting on
<who/what>`, or `→ <the skill that owns it>` — and every open row carries a `Blocks build` mark:
`🔴` (coding waits for it) or `🟢` (build proceeds around it). **A `🔴` row open means the status
header reads `Blocked · **Detail:** <that item>`, never `Planned`** — an open question parked in prose is one the
next session re-argues from zero.

## Status header — one line, always

Every plan opens with one status line directly under its H1, for example:

```markdown
> **Status:** Building · **Detail:** 2/5 · **Updated:** 2026-09-07
```

It names the step the work stopped at, so one `grep` over this folder shows what is unfinished
without opening a single plan:

```bash
grep -H "^> \*\*Status:\*\*" plans/[!_]*.md
```

`[!_]` skips this `_README.md`, whose example header above would otherwise read as live work.
While a plan is live, a `> **Resume:**` line under the status line carries the last handoff's
You now and Next. Every module's plans not `Done`, in one table:
`project-memory/project-memory-status.md` (hook-generated).

The values (`Planned` → `Designed` → `Building` → `Blocked` → `Done`), who writes each, the
`Detail` and `N/M` rules, and the Resume line are defined once in the **Status header** section of
`.claude/skills/_shared-conventions.md`.
