---
name: wp-module-code-trace-flow
description: Trace a feature's call chain through the codebase by reading real source, then refresh the module's <name>-flow.md handover map (flow, called files/methods) and deliver a concrete "where to cut" recommendation to the change's plan. Use when the user wants to modify an existing feature but does not know where in the code to start — "add a display field", "where do I touch for...", "trace this feature". Do NOT trigger for greenfield work with no code to trace, or trivial edits whose location is already known.
---

# Module Code Trace Flow — Feature-to-Flow Mapping

## Core Idea

In maintenance, the hard part is never editing code — it's knowing *where to cut*. This skill does not make the change itself; it starts from a feature or method name, traces the call chain bidirectionally through the **actual source** (grep/read, never recall), and produces two deliverables: a refreshed module flow doc (`<name>-flow.md`) and a concrete "where to cut" recommendation for the user's intended change.

## Two dimensions — depth AND breadth (why single-path tracing misses shared code)

The main path (**depth**) is the readable spine: input → process → output, one chain. But a chain alone is blind to **shared symbols** — a method on `BaseService`/`BaseRepository`, a reused `Result` class, a `ConstValues` entry, or a shared query/column builder used by more than one entry point. These have many callers (**fan-in**), and editing one ripples to every caller.

So every run recovers **both**:

- **Depth** — the main path, one numbered chain (the spine, kept readable).
- **Breadth** — for every *shared* symbol on that chain, ALL its callers (Step 3.5), never pruned to just the one already on the main path.

A symbol is **shared** when it is defined in `Base*`, `ConstValues/`, `Results/`, **or** grep shows more than one caller. Shared symbols are exactly where "I changed this and it broke something else" is born — e.g. a `BaseRepository` shared column list or a dynamic-`Add`-column builder edited to add one field for one table silently adds that column to **every other table** that reuses the builder. Catching that fan-out before the edit is the whole point of the breadth dimension.

## Entry & Boundaries

- **Entry point:** a feature name or method name supplied by the user. Trace **both directions** from it.
- **Upstream stop (input boundary):** stop at the entry point that receives input — controller / handler / UI event / message consumer.
- **Downstream stop (output boundary):** stop at persistence, an external call, or the produced output — repository/query, HTTP/queue client, file/response write.
- **Cross-cutting concerns** (logging, DI registration, generic utilities, framework plumbing) are *noted in passing, never expanded.* They turn a clean line into a spider web.

The shape to recover is always: **input → process → output.**

## Workflow

### Step 0: Establish the intended change (no tracing yet)

Before touching the codebase, ask the user **what change they intend** — this is what makes the final "where to cut" section useful instead of a generic file dump.

- Ask it through the **Question pattern** (`.claude/skills/_shared-conventions.md`): options such as add a display field · change a behavior · fix a bug in this flow · extend an output, with the one the user's words point to marked recommended.
- Also confirm the **entry symbol** to trace from (the feature/method name) if not already clear.
- Ask for an **optional scope hint** — a starting file, module, or directory. If given, it narrows the search; if not, proceed with a codebase-wide grep. Never demand it: not knowing where to look is the exact problem this skill solves.
- If the user says "just map it, no specific change yet" — accept it, skip the cut-recommendation tailoring, and deliver only the flow doc.

### Step 1: Locate the entry symbol in source

Grep for the supplied method/feature name — **within the scope hint if one was given**, otherwise codebase-wide. Confirm the real definition before tracing. If multiple matches survive (common with generic names like `Save` / `GetData` / `Process`), ask which one through the Question pattern, one option per match with its path.

### Step 2: Trace upstream to the input boundary

From the entry symbol, follow callers upward until reaching a controller / handler / UI event / consumer. Record each hop as `file:method`. Stop at the input boundary.

### Step 3: Trace downstream to the output boundary

From the entry symbol, follow callees downward through the process layers until reaching persistence / external call / output. Record each hop as `file:method`. Stop at the output boundary.

### Step 3.5: Sweep every shared symbol for ALL its callers (breadth)

The main path gives you one caller per symbol; this step finds the rest. For **every** shared symbol on the chain (definition above), do a full reference sweep across the whole solution and enumerate **every** call site as `file:method`.

How to sweep — **LSP first, `rg` as the fallback:**

- **LSP `findReferences`** on the symbol's definition (position on the name itself, not its doc comment or modifiers — read the line first). It resolves by type, so a common name like `Insert` or `Save` returns only this symbol's callers. Measured on a .NET 4.7.2 solution: `rg "\bInsert\s*\("` returned 7 hits for one repository method, of which 2 were real callers and 4 were `List.Insert` or comments.
- **Fall back to `rg -n "SymbolName"`** when the LSP tool is absent, errors, or returns nothing. An empty LSP answer is never taken as "no callers": check the position, then sweep with `rg` and filter the hits by hand. LSP needs the C# language server `csharp-ls` on `PATH` (`dotnet tool install --global csharp-ls`, used by the `csharp-lsp` Claude Code plugin) and answers only for the solution in the session's working directory.
- Say which method backed each caller list (`LSP: 2 callers` / `rg: 7 hits, 2 callers after filtering`).

- Tag each caller by entry point (Web / Api / ServBackend) so the blast radius is legible.
- Many callers (say > 15)? List them but cap with a stated count ("28 callers; the 12 in `[Name].Services` shown, rest are views") — never silently truncate.

### Step 4: Assemble and deliver the two outputs

Combine both directions into a single input → process → output chain, draw that chain as the flow doc's Mermaid `sequenceDiagram`, group the touched files, fold in the Step 3.5 fan-in (as the flow doc's shared-symbols table), and write the tailored "where to cut" recommendation for the Step 0 change, every other caller of a shared cut point included. Then persist per the Save Workflow.

## Verification Rule

**No link without a source read.** For every `file:method` in the chain:

- It must come from a file the skill actually opened or grepped during this run.
- If a call target cannot be resolved in source (dynamic dispatch, reflection, config-driven wiring, generated code), mark it `unverified` with a one-line reason — never paper over it with a plausible guess.
- Substituting recalled framework knowledge for an actual read is the primary failure mode this skill exists to prevent.

## Output Templates (two deliverables)

**Deliverable 1 — the module flow doc**, `project-memory/modules/<name>/<name>-flow.md`. No flow doc
yet → copy `project-memory/modules/example-module/example-module-flow.md` (the one source of its
shape), rename its H1 to the module, keep its header block and every heading, then fill it. Fill rules:

- **Flow** — the main path end to end, input → process → output, as one numbered chain:
  `` 1. `path/File.ext : Method()` — one-line role ``.
- **Diagram** — the same chain as a Mermaid `sequenceDiagram`: one participant per class/file on the
  chain, one arrow per numbered step, a dashed return where a value comes back. Draw only what the
  numbered chain holds; never add a call it does not list.
- **Called files & methods** — one row per `file:method` on the chain.
- **Shared symbols & their callers (fan-in)** — one row per Step 3.5 symbol: every caller as
  `file:method`, and its entry points.
- **Notes** — cross-cutting concerns (noted, not expanded) and `unverified` links, each with its reason.
- Every `(e.g.)` placeholder is replaced or removed.

**Deliverable 2 — the where-to-cut recommendation.** This is the payoff of the trace. It goes to the change's plan (`plans/<name>-<date>-<slug>.md`) as the plan's own `## Touch points — what changes where` table — the shape `/wp-module-plan-discuss` Step 4 defines. **Fill that table; never add a second section beside it**, or the plan carries two lists of cut points that drift apart by the first revision. List every other caller of a shared cut point as a Touch points row too, or state "no shared cut points" under the table.

Plan already exists → write the rows into its table (merge with what is there; a row you would duplicate is a row you update instead). No plan yet → present the same table in the conversation, so `/wp-module-plan-discuss` lands it directly:

```markdown
## Touch points — what changes where

| File / object | New or Modified | What changes |
|---|---|---|
| `path/File.ext : Method()` | Modified | [what to add/change here] |
| `StockRepository.Insert()` | Modified | no edit — inherits the new column from `BaseRepository.BuildColumns()` (ServBackend); confirm intended |
```

## Save Workflow

1. **Module identified** (the normal case): persist Deliverable 1 to `project-memory/modules/<name>/<name>-flow.md` — create it, or refresh the existing file in place (merge: update what changed, keep still-valid content). No path dialog; confirm the target module with the user only if it is ambiguous.
2. **Where-to-cut**: route Deliverable 2 to the change's plan as above.
3. **Fallback** (traced code belongs to no module, or the codebase has not adopted this framework): ask the user for a save path — never pick one silently.
4. **Offer a diagram** — `.claude/skills/_optional-diagram.md`.
   Options: "No diagram" (recommended) · "Sequence of the main path" (source: the flow doc's Mermaid block) ·
   "Architecture of the shared-symbol fan-in" (source: the fan-in table). Link line goes under the flow doc's
   `## Diagram` heading.
5. **Close with the handoff** — the **Handoff** section of `.claude/skills/_shared-conventions.md`: Done = the flow doc path + where the where-to-cut landed; You now = review the cut and its blast radius; Next = `/wp-module-plan-discuss` when no plan exists for the change yet, otherwise `/wp-module-technical-design` or the Step 2 act loop per the plan's size.

## Conduct Rules

- One entry symbol per run unless the user asks to map several.
- The run ends at Save Workflow step 5 (the handoff); editing a traced file waits for the user's go.
