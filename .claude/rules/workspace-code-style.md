---
paths:
  - "**/*.cs"
  - "**/*.vb"
  - "**/*.cshtml"
  - "**/*.js"
  - "**/*.sql"
---

# Code Style (path-scoped — loads when a code file is read or written)

The code-level half of `.claude/rules/workspace-reduce-coding-mistake.md`; its §2 *Readability
first* settles any pull between two rules here.

## Plain syntax

Write the form a debugger steps through line by line:

- a nested ternary → `if` / `else` (a single ternary stays);
- a LINQ or array-method chain (`.Where().Select()`, `.map().filter()`) of more than 3 calls →
  named intermediate variables, one step each;
- `?.` / `??` chained more than once → an explicit `null` check;
- an expression-bodied method (`=>`), a tuple return, pattern matching (`is` / `switch` on type) →
  a block body, a named class, an `as` cast plus a `null` check.

## Code shape

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
  *Plain syntax* replaces.

## Comments and imports (every language)

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

## Naming (every language — C#, JavaScript, SQL)

The per-language casing rules in `project-memory/stack-architecture.md` §5 refine how these are spelled.

- **Self-descriptive.** The name alone says what a method does or a variable holds:
  `GetActiveCustomersByRegion`, not `GetData2`; `errorMessage`, not `errMsg`. Exceptions: a
  conventional loop index (`i`, `j`) in a short loop; domain-standard acronyms (`Id`, `Url`, `Html`, `Sql`).
- **Length ≤ 50 characters**, a hard cap. A name nearing it signals a method or variable doing too
  much — reconsider the design instead of truncating into shorthand.
- **The test:** a teammate with no context reads the name and knows roughly what it is; one who must
  open the definition gets a rename.
