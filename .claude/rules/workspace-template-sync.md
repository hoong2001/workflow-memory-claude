# Template Sync Rule — Never Blind-Overwrite Project State

Template updates (master → project) run through `/wp-update-from-master`. The freshly cloned
master's `SYNC-MANIFEST.md` is the only authority for what is copied, merged or deleted — never the
target's local copy. Never bulk-copy `project-memory/`, `.claude/` or the repo over a target: its
real modules and overview are the project's accumulated memory, and an overwrite has no undo.
A path that fits no manifest category → treat it as 🚫 and ask the user.
