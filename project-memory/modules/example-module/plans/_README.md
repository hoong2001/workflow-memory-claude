# plans/ — pre-change plans

Before touching this module, drop a plan here first, then act.
- Produced by: `/wp-module-plan-discuss` (state the goal; five-element gap detection scales the discussion — clarify blanks, challenge conflicts, then persist).
- Optionally deepened by: `/wp-module-technical-design` — appends a "Technical Design" section (API / classes / patterns / SQL / frontend, at cut level) AND a "Tasks" section to the SAME plan file before coding starts. Tasks are vertical increments when the feature is too big for one build pass, plain steps when it is not.
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

Every plan opens with this line directly under its H1:

```markdown
> **Status:** Building · **Detail:** 2/5 · **Updated:** 2026-09-07
```

`Status` is one bare word; `Detail` carries the `N/M` counter or a block reason, and is omitted when
the status needs neither. `Status` names the last thing that actually happened, so a scan tells you which step the work
stopped at — not merely that it stopped. One `grep` reads the whole folder:

```bash
grep -H "^> \*\*Status:\*\*" plans/[!_]*.md
```

`[!_]` skips this `_README.md`, whose example header above would otherwise read as live work.
Every module's plans not `Done`, in one table: `project-memory/project-memory-status.md` (hook-generated).

The value set (`Planned` → `Designed` → `Building` → `Blocked` → `Done`), what each puts in
`Detail`, who writes each one, and the `N/M` rule are defined once in the **Status header** section of
`.claude/skills/_shared-conventions.md` — that file is the authority, this folder does not keep a
second copy to drift from.
