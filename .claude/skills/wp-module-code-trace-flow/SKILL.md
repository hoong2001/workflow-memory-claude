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
- **Upstream stop (input boundary):** the page that fires the request — its view, the script call and the control that triggers it (Step 2) — or, with no page, the controller / handler / message consumer.
- **Downstream stop (output boundary):** the database object the SQL names — table, view, stored procedure, function, synonym (Step 3) — an external call, or the produced output — HTTP/queue client, file/response write.
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

### Step 1.5: Decide who traces

CodeGraph available (Step 1.6) → it traces; skip this step. Otherwise, when the `Codebase Onboarding Engineer` agent is among the available agent types, choose who runs Steps 2–3. Not listed → trace inline.

| Situation | Who traces |
|---|---|
| Entry symbol is clear and the chain is expected to stay within 5 files | You, inline |
| Entry symbol is ambiguous, or the chain crosses several layers or more than 5 files | One agent for the whole chain |
| Upstream and downstream are both long | Two agents in one message, one per direction |
| The user asked only to map, no change | One agent for the whole chain |

The agent starts with no context and cannot ask the user, so its prompt carries the confirmed entry symbol, the scope hint, both boundaries (Entry & Boundaries), and the return format: each hop as `file:method` in call order, the boundary reached, every link it could not resolve with the reason, and the full list of files inspected. Cut points, edits and file writes stay with you.

The report is a lead list. Open the file of every hop that feeds a cut point or a shared symbol; a hop you did not open is marked `unverified` (Verification Rule). Step 3.5 and everything after it run inline, since they need the whole chain. The flow doc's Notes then carry one line, `Traced by: inline` or `Traced by: agent — <why>`; Step 1.5 is done when that line is written.

### Step 1.6: CodeGraph first, when available

CodeGraph is the default tracer when the repo root holds a `.codegraph/` directory and `codegraph_explore` is among the available tools. Either is missing → skip to Step 2; the skill runs as written (Step 1.5 included) and nothing needs installing.

Call `codegraph_explore` with the confirmed entry symbol and `projectPath` set to the repo root, and take Steps 2–3 from its call paths and verbatim source, recording each hop as `file:method`; the source it shows counts as read. Call it again for any symbol the first answer leaves unresolved. The index can lag the working tree, so when it disagrees with the file, the file wins. A hop it cannot resolve (dynamic dispatch, DI, reflection) falls back to `rg` and the file, else `unverified`. The Notes line reads `Traced by: CodeGraph`.

### Step 2: Trace upstream to the input boundary

From the entry symbol, follow callers upward until reaching a controller / handler / consumer. Record each hop as `file:method`.

A controller action a page calls is one hop short of the boundary: the page reaches it by a URL string, which CodeGraph and LSP cannot follow. `rg` the action's route (`<Controller>/<Action>`, and the URL or form helpers that name the action) across the views and scripts, and record the view, the script function that fires the call, and the control that triggers it. No hit → `unverified — no caller found in views or scripts`. Step 2 is done when the chain starts at a control on a page, at a non-page entry point, or at an `unverified` link.

### Step 3: Trace downstream to the output boundary

From the entry symbol, follow callees downward through the process layers until reaching persistence / external call / output. Record each hop as `file:method`.

The data-access method is one hop short of the boundary: read its SQL text and record **every** object it names —

- **Kind** — table / view / stored procedure / function / synonym.
- **Database** — the connection the method runs on (name the connection-string key, never its value), or the database prefix in the object's name.
- **Read or write**, and the method that does it.

A view, stored procedure or function is one more hop: open its definition (the module's `schema/`, else `rg` the repo for its `CREATE`) and record the objects it reads and writes the same way. SQL assembled at run time → record the objects every branch can name.

A file is data too, wherever on the chain it is touched — an upload, an import, an export, a generated report. Sweep every file on the chain for file access (`System.IO` calls, streams, the upload object, and each file library the project references), and record for each file:

- **Format** — Excel, DBF, CSV, text, PDF …
- **Path source** — the config key, request field or constant the path comes from; name the source, never a machine path.
- **Input or output**, and the method that reads or writes it.

Step 3 is done when every data-access method on the chain has its objects, and every file access its file, recorded or marked `unverified`.

### Step 3.1: Read the structure the repo does not hold

A definition missing from the repo, or a table on the chain whose columns and keys no `schema/` file gives, lives in the database. Read it under `.claude/skills/_database-access.md` — the ask, the read-only connect and the fallbacks are there. What to read: each missing definition and, for every table on the chain, its columns, types, keys and foreign keys.

Step 3.1 is done when every object of Step 3 has a definition read, or an `unverified` mark the user chose.

### Step 3.2: Trace the field (the change names one)

The Step 0 change names a field — a value shown, saved or calculated → follow that field hop by hop, each hop as `file:line`; a field that does not exist yet follows its nearest sibling on the same screen:

table column → SQL select / alias (or the stored procedure's result column) → Result property → ViewModel or JSON property → script binding → the control or grid column that shows it.

A saved value runs the same path in reverse, control → column. Step 3.2 is done when every hop from column to control is recorded or marked `unverified`. "Just map it" runs skip this step.

### Step 3.5: Sweep every shared symbol for ALL its callers (breadth)

The main path gives you one caller per symbol; this step finds the rest. For **every** shared symbol on the chain (definition above), do a full reference sweep across the whole solution and enumerate **every** call site as `file:method`.

How to sweep — **CodeGraph first when available (Step 1.6); the second source (LSP, `rg` as the fallback) covers where the index is weakest. Without CodeGraph, the second source sweeps every shared symbol:**

- **CodeGraph**: one `codegraph_explore` call naming every shared symbol of the chain gives each one's caller count — a count only: the answer is capped, so a symbol can be left out of its summary and a call list ends in `… and N more`. List each symbol's callers in full with the CLI, `codegraph callers <Symbol> -l <count + 10> -p <repo root>` (`-f <file>` when the name has several definitions); a list shorter than `-l` is complete.
- **Second source** on a symbol when any of these holds: it is a cut point (where the change lands); CodeGraph returned no callers (an empty answer is never "no callers"); it is an interface, virtual or abstract member, event, delegate, or DI-registered type — the index's blind spots. Every other symbol keeps its CodeGraph list, tagged `CodeGraph only`.
- **Merge**: on a symbol that ran both, the caller list is the union. A caller only the second source found is tagged `missed by CodeGraph` and noted in the flow doc's Notes, so the next reader knows how far to trust the index.
- **LSP `findReferences`** on the symbol's definition (position on the name itself, not its doc comment or modifiers — read the line first). It resolves by type, so a common name like `Insert` or `Save` returns only this symbol's callers. Measured on a .NET 4.7.2 solution: `rg "\bInsert\s*\("` returned 7 hits for one repository method, of which 2 were real callers and 4 were `List.Insert` or comments.
- **Fall back to `rg -n "SymbolName"`** when the LSP tool is absent, errors, or returns nothing. An empty LSP answer is never taken as "no callers": check the position, then sweep with `rg` and filter the hits by hand. LSP needs the C# language server `csharp-ls` on `PATH` (`dotnet tool install --global csharp-ls`, used by the `csharp-lsp` Claude Code plugin) and answers only for the solution in the session's working directory.
- Say which methods backed each caller list (`CodeGraph only: 3 callers` / `CodeGraph: 3 + LSP: 1 extra = 4 callers` / `LSP: 2 callers` / `rg: 7 hits, 2 callers after filtering`).

- Tag each caller by entry point (Web / Api / ServBackend) so the blast radius is legible.
- Many callers (say > 15)? List them but cap with a stated count ("28 callers; the 12 in `[Name].Services` shown, rest are views") — never silently truncate.

### Step 4: Assemble and deliver the two outputs

Combine both directions into a single input → process → output chain, draw that chain as the flow doc's Mermaid `sequenceDiagram`, its Data flow `flowchart` with the Database objects and Files tables (Step 3), its Data model `erDiagram` (Step 3.1) and its States `stateDiagram-v2`, group the touched files, fold in the Step 3.5 fan-in (as the flow doc's shared-symbols table), and write the tailored "where to cut" recommendation for the Step 0 change, every other caller of a shared cut point included. Then persist per the Save Workflow.

## Verification Rule

**No link without a source read.** For every `file:method` in the chain:

- It must come from a file the skill actually opened or grepped during this run.
- If a call target cannot be resolved in source (dynamic dispatch, reflection, config-driven wiring, generated code), mark it `unverified` with a one-line reason — never paper over it with a plausible guess.
- Substituting recalled framework knowledge for an actual read is the primary failure mode this skill exists to prevent.

## Output Templates (two deliverables)

**Deliverable 1 — the module flow doc**, `project-memory/modules/<name>/<name>-flow.md`. No flow doc
yet → copy `project-memory/modules/example-module/example-module-flow.md` (the one source of its
shape), rename its H1 to the module, keep its header block and every heading, then fill it. Fill rules:

- **Diagram** — the main path end to end, input → process → output, as a Mermaid `sequenceDiagram`:
  one participant per class/file on the chain, one arrow per call, a dashed return where a value
  comes back. Draw only what the Called files table holds; never add a call it does not list.
- **Data flow** — a Mermaid `flowchart` of the database objects and files the chain reads or
  writes, each tied to the method that touches it, then the **Database objects** table: one row
  per object Step 3 recorded, the objects behind a view or stored procedure included, and the
  **Files** table: one row per file Step 3 recorded. A table with no rows holds `None`.
- **Data model** — a Mermaid `erDiagram` of the tables on the chain with their keys and
  relationships, drawn from `schema/` or Step 3.1; `None — structure not read` when neither gave it.
- **States** — one Mermaid `stateDiagram-v2` per status field the chain reads or sets: a state per
  constant of that field, a transition per caller Step 3.5 found setting it, labelled
  `Class.Method`. A transition no source read confirms is `unverified`; `None — no status field`
  when the chain touches none.
- **Called files & methods** — one row per `file:method` on the chain, the view and script of
  Step 2 included, `#` = its order on the main path (blank for a file off the path).
- **Shared symbols & their callers (fan-in)** — one row per Step 3.5 symbol: every caller as
  `file:method`, and its entry points.
- **Notes** — the `Traced by:` line (Step 1.5), cross-cutting concerns (noted, not expanded) and `unverified` links, each with its reason.
- Every `(e.g.)` placeholder is replaced or removed.

**Deliverable 2 — the where-to-cut recommendation.** This is the payoff of the trace. It goes to the change's plan (`plans/<name>-<date>-<slug>.md`) as the plan's own `## Touch points — what changes where` table — the shape `/wp-module-plan-discuss` Step 4 defines. **Fill that table; never add a second section beside it**, or the plan carries two lists of cut points that drift apart by the first revision. List every other caller of a shared cut point as a Touch points row too, or state "no shared cut points" under the table. Every hop of the Step 3.2 field path is a Touch points row, in path order, a database object the change alters included.

Plan already exists → write the rows into its table (merge with what is there; a row you would duplicate is a row you update instead). No plan yet → present the same table in the conversation, so `/wp-module-plan-discuss` lands it directly:

```markdown
## Touch points — what changes where

| File / object | New or Modified | What changes |
|---|---|---|
| `path/File.ext : Method()` | Modified | [what to add/change here] |
| `StockRepository.Insert()` | Modified | no edit — inherits the new column from `BaseRepository.BuildColumns()` (ServBackend); confirm intended |
```

## Save Workflow

1. **Module identified** (the normal case): persist Deliverable 1 to `project-memory/modules/<name>/<name>-flow.md` — create it, or refresh the existing file in place (merge: update what changed, keep still-valid content). A refreshed doc keeps its own shape: patch a `## Flow`, Diagram, Data flow, Data model or States section it already has, and add none it lacks unless the user asks. No path dialog; confirm the target module with the user only if it is ambiguous.
2. **Where-to-cut**: route Deliverable 2 to the change's plan as above.
3. **Fallback** (traced code belongs to no module, or the codebase has not adopted this framework): ask the user for a save path — never pick one silently.
4. **Offer a diagram** — `.claude/skills/_optional-diagram.md`.
   Options: "No HTML diagram" (recommended) · "Sequence of the main path" (source: the flow doc's Mermaid block) ·
   "Architecture of the shared-symbol fan-in" (source: the fan-in table). Link line goes under the flow doc's
   `## Diagram` heading.
5. **Close with the handoff** — the **Handoff** section of `.claude/skills/_shared-conventions.md`: Done = the flow doc path, one leaf per diagram it now carries (Diagram, Data flow, Data model, States — `None` ones named as such) + where the where-to-cut landed; You now = review the cut and its blast radius; Next = `/wp-module-plan-discuss` when no plan exists for the change yet, otherwise `/wp-module-technical-design` or the Step 2 act loop per the plan's size.

## Conduct Rules

- One entry symbol per run unless the user asks to map several.
- The run ends at Save Workflow step 5 (the handoff); editing a traced file waits for the user's go.
