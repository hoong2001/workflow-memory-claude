# Shared skill conventions

Not a skill — a shared reference for the workflow skills in this folder, so one rule used by
several skills has exactly one wording. A skill that names a section below follows it in full;
nothing here overrides a skill's own explicit instruction.

## Question pattern

Every question a discussion skill asks follows two steps:

1. **Infer first** — state your recommended answer up front, with the reasoning behind it (from
   the plan, the module docs, the code, or the stack constraints). Let the user simply accept it.
2. **Options on rejection** — if the user rejects or doubts the inference, immediately present
   **4 concrete alternative options plus 1 free-form custom choice**. Use the AskUserQuestion tool
   when it is available: put your recommendation first, marked "(Recommended)"; its built-in
   "Other" serves as the custom choice. Each option must be a real, distinct direction with a
   one-line trade-off — never filler to pad the count.

## Interview conduct

- **One question at a time** — wait for the answer before asking the next.
- **Explore before asking** — if the codebase or the existing docs can answer it, read them
  instead of spending a question on it.
