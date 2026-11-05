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

## 5. Code shape

- **One job per method, read top to bottom.** A method computes its values into local variables
  and uses them in order, so the reader follows one method, not a chain. A method takes at most 6
  parameters; a seventh means grouping them into one object.
- **Extract a method when it earns a name:** two or more callers, a guard (validation, whitelist,
  parameter or IN-list builder), or a named step of about 15 lines or more. A single-caller step
  below that bar stays inline, under a one-line comment.
- **Two hops at most.** From a public method, every value it uses is found within two levels of
  private calls.
- **Return values; keep state local.** A helper returns what it computes and the caller assigns it;
  a `void` helper that changes an object passed in hides the order its callers depend on, so pass
  the result back instead. A SQL condition and its `param.Add` sit in the same block. A `bool` that
  switches behaviour through several layers becomes two plain methods, or the caller decides.
- **Failure is an exception.** A method signals failure by throwing, never by returning a code or flag.
  A `try/catch` longer than a few lines moves into its own method, so the caller reads the happy path.
- **Talk to direct collaborators only** (Law of Demeter). `order.Customer.Address.City` becomes a
  call that asks `order` for the city.
- **Smell sweep before handoff.** Scan the code this task wrote for a magic literal, a seventh
  parameter, a method with two jobs, a single-caller helper below the extraction bar, a value more
  than two hops from its public method, a name that needs its definition to be understood.
