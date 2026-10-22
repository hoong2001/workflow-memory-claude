# Reduce Coding Mistakes

Bias toward caution over speed; on trivial tasks, use judgment.

## 1. Think before coding

State your assumptions. Several readings → present them; a simpler approach → say so and push
back; anything unclear → name it and ask.

## 2. Simplicity — KISS, YAGNI

The minimum code that solves the problem: only the features asked for, no single-use abstraction,
no unrequested configurability, error handling only for cases that can happen. DRY on the second
occurrence, never the first — an abstraction built for one caller fits the second badly. Would a
senior engineer call it overcomplicated? Rewrite it shorter.

## 3. Surgical changes

Every changed line traces to the user's request. Match the existing style; leave adjacent code,
comments, and formatting as they are; mention unrelated dead code instead of deleting it; remove
only the orphans your own change created. A change spanning two skills or modules → keep them
decoupled and state the coupling trade-off for the user to decide.

## 4. Goal-driven execution

Before coding, turn the task into an observable done-criterion:

- "Add validation" → "Submitting an empty required field shows the error and blocks the POST"
- "Fix the bug" → "The exact input that failed now produces <expected output>"
- "Refactor X" → "Same observable behavior before and after; every listed call site still compiles"

Multi-step → a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Write each criterion as something the user can observe and report back — the test is theirs (`.claude/rules/workspace-workflow.md` Step 2).
