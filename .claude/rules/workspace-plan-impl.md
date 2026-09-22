# Project Documentation Rules

Paths and triggers live in `workspace-workflow.md` — Step 2 routes plans, Step 3 routes the
wrap-up. This file owns only the principles that apply to EVERY document written under
`project-memory/` (plans, impl records, MODULE.md, flow docs, the overview) or `.claude/`:

- **One task, one document.** A task's plan is a single file; `/wp-module-technical-design`
  appends its sections into it, never a sibling file — so the
  plan and its paired `impl/` record stay one-to-one.
- **Write at the milestone, not at session end.** A document deferred is a document lost.
- **Write for a reader with no prior context** — a future session must be able to act on it
  without re-deriving the conversation that produced it.
- **If the document already exists, update it** — never create a duplicate.
- **Change a convention → sweep every doc that restates it, in the same turn.** Renaming a
  section, changing a status value, altering a template's shape or a rule's wording is not done
  when that file is saved: grep the repo for the old wording
  (`grep -rn "<old section name / value / rule>" --include="*.md" .`) and check each hit for a
  stale copy, a section name that no longer exists, a downstream skill that consumes it, and the
  README/index rows describing it. Report which files were swept. **Nobody should have to ask
  "are all the docs aligned?"** — a half-aligned convention is worse than the old one, because two
  files now disagree and the next session follows whichever it opens first.
- **Writing style** — before writing any document, read
  `.claude/rules/workspace-doc-writing-style.md` (read on demand, not always-on).
