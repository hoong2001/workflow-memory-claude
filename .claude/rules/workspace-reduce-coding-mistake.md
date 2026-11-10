# Reduce Coding Mistakes

Bias toward caution over speed; on trivial tasks, use judgment.

## 1. Think before coding

State your assumptions. Several readings → present them; a simpler approach → say so and push
back; anything unclear → name it and ask.

## 2. Readability first — KISS, YAGNI

Readability and maintainability rank first, above cleverness and brevity: a teammate new to the code
reads it top to bottom without pausing and changes one part without breaking another. When another
rule pulls against that, they win. Performance may cost readability only with a measured number —
row count, run time — written in the comment above the code that pays for it.

The minimum code that solves the problem: only the features asked for, no single-use abstraction,
no unrequested configurability, error handling only for cases that can happen. DRY on the second
occurrence, never the first — an abstraction built for one caller fits the second badly. A design a
senior engineer would call over-engineered gets cut back.

**Plain syntax** — write the form a debugger steps through line by line:

- a nested ternary → `if` / `else` (a single ternary stays);
- a LINQ chain of more than 3 calls → named intermediate variables, one step each;
- `?.` / `??` chained more than once → an explicit `null` check;
- an expression-bodied method (`=>`), a tuple return, pattern matching (`is` / `switch` on type) →
  a block body, a named class, an `as` cast plus a `null` check.

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
  than two hops from its public method, a name that needs its definition to be understood, a form
  §2 *Plain syntax* replaces.

## 6. Comments and imports (every language)

- **Comments.** A comment you write or rewrite opens with today's date as `yyyy.MM.dd`, then gives
  the reason for the code block and the problem it solves, in under 120 characters (the date is not
  counted). It sits directly above the block it explains, so every block carries its own comment;
  `/// <summary>` holds the method's overview only.
  `// 2026.10.23 Closed accounts carry no balance; skipping them avoids a divide-by-zero in the average.`
  In `/// <summary>` the date opens the first text line; a multi-line comment dates its first
  line only. Older `yyyy-MM-dd` dates stay as written.
- **Imports.** They sit at the top of the file — `using`, `Imports`, `import`, `require` — and belong
  to the change that needs them, not to adjacent code. The body names an imported item the way
  its language does: the short name in C#, VB, Java and JS; `module.name` in Python and Go. A
  fully-qualified path written inline is for a clash only — e.g. `System.Web.Http` and
  `System.Web.Mvc` attributes in one file.

## 7. Naming (every language — C#, JavaScript, SQL)

The per-language casing rules in `project-memory/stack-architecture.md` §5 refine how these are spelled.

- **Self-descriptive.** The name alone says what a method does or a variable holds:
  `GetActiveCustomersByRegion`, not `GetData2`; `errorMessage`, not `errMsg`. Exceptions: a
  conventional loop index (`i`, `j`) in a short loop; domain-standard acronyms (`Id`, `Url`, `Html`, `Sql`).
- **Length ≤ 50 characters**, a hard cap. A name nearing it signals a method or variable doing too
  much — reconsider the design instead of truncating into shorthand.
- **The test:** a teammate with no context reads the name and knows roughly what it is; one who must
  open the definition gets a rename.
