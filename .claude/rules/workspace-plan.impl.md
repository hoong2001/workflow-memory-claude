# Project Documentation Rules

## Documentation Automation Rules

### Plan Documents
After completing any of the following, **immediately** invoke the `workspace-task-brief` skill (or `workspace-grill-with-docs` when the goal was already clear and the plan was grilled instead):
- Requirements analysis or feature planning
- Architecture design proposal
- Task breakdown completion
- User confirms a plan or design direction

The skill will determine the appropriate storage path based on the project environment.

When a brief already exists and the user wants the technical breakdown nailed down before
coding, invoke `workspace-brief-to-technical-design` — it appends a "Technical Design"
section to the SAME plan document (never a separate file).

### Implementation Documents
After completing any of the following, **immediately** invoke the `workspace-save-implementation` skill (this project's version — saves to the module's `impl/` folder AND syncs `<name>-flow.md`; do NOT use the generic `save-implementation`):
- Completing a feature module
- Completing a refactor
- Resolving a significant bug
- User confirms implementation is done

### Core Principles
- Do not wait until the session ends — **document immediately after each milestone**
- Documents must be readable by a future Claude session with no prior context
- If a document already exists, update it — do not create a duplicate