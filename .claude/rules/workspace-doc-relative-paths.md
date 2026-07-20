# Documentation Path Rule — No Absolute Paths

When writing file names or file paths into any document (specs, plans, impl records,
MODULE.md, flow.md, CLAUDE.md, anything under `.claude/`), NEVER write absolute paths
(e.g. `G:\...`, `C:\Users\...`). Always use paths relative to the project root
(e.g. `.claude/modules/example-module/MODULE.md`).

**Why:** This project lives on a synced drive. Absolute paths break the moment the
project is opened on another machine, drive letter, or user account, and they leak
local environment details into shared documentation.

**How to apply:** Before saving any document that references files, scan it for drive
letters or user-home prefixes and rewrite them as project-root-relative paths. This
includes documents produced by any skill.
