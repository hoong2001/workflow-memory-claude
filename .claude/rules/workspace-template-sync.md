# Template Sync Rule — Never Blind-Overwrite Project State

Template updates (master → project) run only through `/wp-update-from-master`, which owns the
procedure — the user runs it. A bulk copy of `project-memory/`, `.claude/`, or the repo over a
target destroys its accumulated memory with no undo.
