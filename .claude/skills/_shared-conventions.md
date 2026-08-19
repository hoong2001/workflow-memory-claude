# Shared skill conventions

Not a skill — a shared reference for the workflow skills in this folder, so one rule used by
several skills has exactly one wording. A skill that names a section below follows it in full;
nothing here overrides a skill's own explicit instruction.

## Question pattern

Every question a discussion skill asks goes through the `AskUserQuestion` tool — never a
plain-text statement waiting for a nod, and never gated behind a rejection first.

1. **Infer, then ask** — work out your recommended answer from the plan, the module docs,
   the code, or the stack constraints, and use it as the first option, marked "(Recommended)".
2. **3 more real alternatives + 1 custom** — the other 3 options must each be a genuine,
   distinct direction with a one-line trade-off, never filler to pad the count.
   `AskUserQuestion`'s built-in "Other" serves as the free-form custom choice.

If `AskUserQuestion` is unavailable in the current environment, fall back to listing the
same 4 options as plain text and asking the user to pick one or state a custom answer —
never revert to a bare statement waiting for a nod.

## Interview conduct

- **One question at a time** — wait for the answer before asking the next.
- **Explore before asking** — if the codebase or the existing docs can answer it, read them
  instead of spending a question on it.
