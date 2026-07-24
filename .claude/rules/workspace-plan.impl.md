# Project Documentation Rules

## Plan documents
A module-level requirement is talked into a plan via `/workspace-module-plan-discuss` —
fixed path `.claude/modules/<name>/plans/<name>-<date>-<slug>.md`. When a plan exists and
only the technical cut is missing, `/workspace-module-technical-design` appends a
"Technical Design" section to the SAME plan file (never a separate file). Likewise, when a
feature is too big for one build pass, `/workspace-module-slice-plan` appends a "Build
Increments" section (ordered vertical slices) to that SAME plan file — one plan file per
task, always.

## Implementation documents
Saving the impl record is the USER's trigger — they judge when the task is complete.
After a feature, refactor, or significant bug fix is done, remind in one line that
`/workspace-module-save-implementation` is ready (this project's version — saves to the
module's `impl/` folder AND syncs `<name>-flow.md`); NEVER auto-run it.

## Core principles
- Document immediately after each milestone — don't wait for the session to end.
- Documents must be readable by a future Claude session with no prior context.
- If a document already exists, update it — never create a duplicate.
