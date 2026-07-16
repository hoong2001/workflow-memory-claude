# Project Documentation Rules

## Documentation Automation Rules

### Plan Documents
After completing any of the following, **immediately** invoke the `workspace-module-plan-discuss` skill:
- Requirements analysis or feature planning
- Architecture design proposal
- Task breakdown completion
- User confirms a plan or design direction

The skill will determine the appropriate storage path based on the project environment.

When a brief already exists and the user wants the technical breakdown nailed down before
coding, invoke `workspace-module-technical-design` — it appends a "Technical Design"
section to the SAME plan document (never a separate file).

### Implementation Documents
After completing any of the following, **remind the user in one line** that `/workspace-module-save-implementation` is ready to run (this project's version — saves to the module's `impl/` folder AND syncs `<name>-flow.md`; do NOT use the generic `save-implementation`). **Do NOT auto-run it — the trigger belongs to the user**; run only on their go or explicit invocation:
- Completing a feature module
- Completing a refactor
- Resolving a significant bug
- User confirms implementation is done

### Core Principles
- Do not wait until the session ends — **document immediately after each milestone**
- Documents must be readable by a future Claude session with no prior context
- If a document already exists, update it — do not create a duplicate