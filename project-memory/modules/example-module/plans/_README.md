# plans/ — pre-change plans

Before touching this module, drop a plan here first, then act.
- Produced by: `/wp-module-plan-discuss` (state the goal; five-element gap detection scales the discussion — clarify blanks, challenge conflicts, then persist).
- Optionally deepened by: `/wp-module-technical-design` — appends a "Technical Design" section (API / classes / SQL / frontend) to the SAME plan file before coding starts.
- Naming: `<name>-<date>-<slug>.md` (module-name prefixed), e.g. `orders-2026-06-23-add-login.md`.
- Pairs with the same-named file in `impl/`: left = "how I plan to do it", right = "how it was actually done".

## Status header — one line, always

Every plan opens with this line directly under its H1:

```markdown
> **Status:** Building 2/5 · **Updated:** 2026-09-07
```

`Status` names the last thing that actually happened, so a scan tells you which step the work
stopped at — not merely that it stopped:

| Value | Means | Written by |
|---|---|---|
| `Planned` | The plan exists; nothing else has happened | `/wp-module-plan-discuss` |
| `Designed` | A `## Technical Design` section has been appended | `/wp-module-technical-design` |
| `Sliced` | A `## Build Increments` section has been appended | `/wp-module-slice-plan` |
| `Building` | Code has started; this plan has no increments table | the Step 2 act loop |
| `Building N/M` | Code has started on a sliced plan | the Step 2 act loop |
| `Blocked: <one line>` | Stopped on something external | whoever hits the blocker |
| `Done` | Finished | `/wp-module-save-implementation` |

Whoever appends a section sets `Status` to their own value — no exceptions to remember.
`Designed` and `Sliced` may arrive in either order; the header carries whichever ran last.

**The `N/M` counter appears only when the plan has a `## Build Increments` table**, where `N` is
the number of `☑` rows and `M` the total. A plan that builds in one pass has nothing to count, and
`Building` alone is its complete progress. Because the count is derived from the table, a stale
number self-corrects on the next read instead of contradicting it.

The header exists so unfinished work is found by scanning headers, never by opening every plan —
`grep -H "^> \*\*Status:\*\*" plans/*.md` lists the whole folder's state in one shot, then only
the live plan gets read in full. The plan is the single source of truth for its own progress; no
other file carries a copy, so there is nothing to drift.
