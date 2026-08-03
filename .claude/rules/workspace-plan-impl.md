# Project Documentation Rules

Paths and triggers live in `workspace-workflow.md` — Step 2 routes plans, Step 3 routes the
wrap-up. This file owns only the principles that apply to EVERY document written under `.claude/`:

- **One task, one document.** A task's plan is a single file; `/wp-module-technical-design`
  and `/wp-module-slice-plan` append their sections into it, never a sibling file — so the
  plan and its paired `impl/` record stay one-to-one.
- **Write at the milestone, not at session end.** A document deferred is a document lost.
- **Write for a reader with no prior context** — a future session must be able to act on it
  without re-deriving the conversation that produced it.
- **If the document already exists, update it** — never create a duplicate.
