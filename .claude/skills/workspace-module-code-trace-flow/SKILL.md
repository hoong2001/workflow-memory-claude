---
name: workspace-module-code-trace-flow
description: Trace a feature's call chain through the codebase by reading real source, then refresh the module's <name>-flow.md handover map (flow, called files/methods) and deliver a concrete "where to cut" recommendation to the change's plan. Use when the user wants to modify an existing feature but does not know where in the code to start — "add a display field", "where do I touch for...", "trace this feature". Do NOT trigger for greenfield work with no code to trace, or trivial edits whose location is already known.
---

# Module Code Trace Flow — Feature-to-Flow Mapping

## Core Idea

In maintenance, the hard part is never editing code — it's knowing *where to cut*. This skill does not make the change itself; it starts from a feature or method name, traces the call chain bidirectionally through the **actual source** (grep/read, never recall), and produces two deliverables: a refreshed module flow doc (`<name>-flow.md`) and a concrete "where to cut" recommendation for the user's intended change.

A map built from memory is worthless and dangerous. **Every link in the chain must be backed by a file the skill actually read.** If a link can't be verified in source, it is marked as a gap, not guessed.

## Two dimensions — depth AND breadth (why single-path tracing misses shared code)

The main path (**depth**) is the readable spine: input → process → output, one chain. But a chain alone is blind to **shared symbols** — a method on `BaseService`/`BaseRepository`, a reused `Result` class, a `ConstValues` entry, or a shared query/column builder used by both Web and ServBackend. These have many callers (**fan-in**), and editing one ripples to every caller.

So every run recovers **both**:

- **Depth** — the main path, one numbered chain (the spine, kept readable).
- **Breadth** — for every *shared* symbol on that chain, ALL its callers, enumerated by a full reference sweep (`rg`), never pruned to just the one already on the main path.

A symbol is **shared** when it is defined in `Base*`, `ConstValues/`, `Results/`, **or** grep shows more than one caller. Shared symbols are exactly where "I changed this and it broke something else" is born — e.g. a `BaseRepository` shared column list or a dynamic-`Add`-column builder edited to add one field for one table silently adds that column to **every other table** that reuses the builder. Catching that fan-out before the edit is the whole point of the breadth dimension.

## Entry & Boundaries

- **Entry point:** a feature name or method name supplied by the user. Trace **both directions** from it.
- **Scope hint (optional):** if the user can name a starting file, module, or directory, narrow the search to it — faster and far less noise. If they only have the method name, fall back to a codebase-wide grep and disambiguate matches (Step 1).
- **Upstream stop (input boundary):** stop at the entry point that receives input — controller / handler / UI event / message consumer.
- **Downstream stop (output boundary):** stop at persistence, an external call, or the produced output — repository/query, HTTP/queue client, file/response write.
- **Cross-cutting concerns** (logging, DI registration, generic utilities, framework plumbing) are *noted in passing, never expanded.* They turn a clean line into a spider web.

The shape to recover is always: **input → process → output.**

## Workflow

### Step 0: Establish the intended change (no tracing yet)

Before touching the codebase, ask the user **what change they intend** — this is what makes the final "where to cut" section useful instead of a generic file dump.

- Ask one short question with concrete options, e.g.: add a display field? change a behavior? fix a bug in this flow? extend an output?
- Also confirm the **entry symbol** to trace from (the feature/method name) if not already clear.
- Ask for an **optional scope hint** — a starting file, module, or directory. If given, it narrows the search; if not, proceed with a codebase-wide grep. Never demand it: not knowing where to look is the exact problem this skill solves.
- If the user says "just map it, no specific change yet" — accept it, skip the cut-recommendation tailoring, and deliver only the flow doc.

### Step 1: Locate the entry symbol in source

Grep for the supplied method/feature name — **within the scope hint if one was given**, otherwise codebase-wide. Confirm the real definition before tracing. If multiple matches survive (common with generic names like `Save` / `GetData` / `Process`), list them with their file paths and ask which one — do not silently pick.

### Step 2: Trace upstream to the input boundary

From the entry symbol, follow callers upward until reaching a controller / handler / UI event / consumer. Record each hop as `file:method`. Stop at the input boundary.

### Step 3: Trace downstream to the output boundary

From the entry symbol, follow callees downward through the process layers until reaching persistence / external call / output. Record each hop as `file:method`. Stop at the output boundary.

### Step 3.5: Sweep every shared symbol for ALL its callers (breadth)

The main path gives you one caller per symbol; this step finds the rest. For **every** symbol on the chain that is shared (defined in `Base*`, `ConstValues/`, `Results/`, or a grep shows more than one caller), do a full reference sweep — `rg -n "SymbolName"` across the whole solution — and enumerate **every** call site as `file:method`, not just the one already on the main path.

- Tag each caller by entry point (Web / ServBackend) so the blast radius is legible.
- Many callers (say > 15)? List them but cap with a stated count ("28 callers; the 12 in `[Name].Services` shown, rest are views") — never silently truncate.
- This is the step that catches "changed a shared method, broke another consumer." Skipping it for a shared symbol is the exact defect this skill now exists to prevent — the dynamic-column-builder fan-out above is the canonical case.

### Step 4: Assemble and deliver the two outputs

Combine both directions into a single input → process → output chain, group the touched files, fold in the Step 3.5 fan-in (as the flow doc's shared-symbols table), and write the tailored "where to cut" recommendation **plus its blast-radius list** for the Step 0 change. Then persist per the Save Workflow: **the stable flow (chain + shared-symbol fan-in) goes into the module's `<name>-flow.md`; the where-to-cut and its blast radius go into the change's plan (`plans/`), never into the flow doc.**

## Verification Rule

**No link without a source read.** For every `file:method` in the chain:

- It must come from a file the skill actually opened or grepped during this run.
- If a call target cannot be resolved in source (dynamic dispatch, reflection, config-driven wiring, generated code), mark it `unverified` with a one-line reason — never paper over it with a plausible guess.
- Substituting recalled framework knowledge for an actual read is the primary failure mode this skill exists to prevent.
- **Completeness for shared symbols (Step 3.5).** No shared symbol may be reported without a full reference sweep. State the grep count backing its caller list (e.g. "`rg` found 6 callers, all listed"); if capped, say the cap and where the rest live. An unswept shared symbol is as dangerous as a guessed link — it is precisely how a shared-method edit silently breaks another consumer.

## Output Templates (two deliverables)

**Deliverable 1 — the module flow doc.** Persisted to `.claude/modules/<name>/<name>-flow.md`, using the module template's structure (same headings as `example-module-flow.md`). Keep only the stable "how it works" parts:

```markdown
# [Module Name] — Flow (handover map)

## Flow

[The main path end to end, input → process → output. One numbered chain:]
1. `path/File.ext : Method()` — [one-line role]
2. ...

## Called files & methods

| File | Method | Role (short) |
|---|---|---|
| ... | ... | ... |

## Shared symbols & their callers (fan-in)

Only the symbols reused across the chain (`Base*`, `ConstValues/`, `Results/`, or multi-caller). This is the stable "who else depends on this" map — it makes every future blast-radius check instant instead of a fresh grep.

| Shared symbol | Callers (`file:method`) | Entry points |
|---|---|---|
| `BaseRepository.BuildColumns()` | `OrderRepository.Insert()`, `StockRepository.Insert()` | Web, ServBackend |

## Notes

- Cross-cutting (noted, not expanded): logging via …, DI via …
- Unverified links (could not be resolved in source): `...` — [reason]
```

**Deliverable 2 — the where-to-cut recommendation.** This is the payoff of the trace, and it does **NOT** go into the flow doc (the flow doc holds only stable structure — a specific change's cut points belong to that change). Hand it to the change's plan (`plans/<name>-<date>-<slug>.md`, appended or created via `/workspace-module-plan-discuss`), or present it in the conversation if no plan exists yet:

```markdown
## Where to Cut — [intended change, from Step 0]

- [ ] `path/File.ext : Method()` — [what to add/change here]
- [ ] ...

## Blast Radius — other callers inheriting a shared-symbol edit

If any cut point above is a shared symbol, list EVERY other caller that inherits the change so each is checked before it breaks. State "no shared cut points" explicitly when the list is empty — never omit this section silently.

| Shared symbol edited | Other caller (`file:method`) | Entry point | Effect / re-check |
|---|---|---|---|
| `BaseRepository.BuildColumns()` | `StockRepository.Insert()` | ServBackend | also gets the new column — confirm intended |
```

## Save Workflow

1. **Module identified** (the normal case): persist Deliverable 1 to `.claude/modules/<name>/<name>-flow.md` — create it, or refresh the existing file in place (merge: update what changed, keep still-valid content). No path dialog; confirm the target module with the user only if it is ambiguous.
2. **Where-to-cut**: route Deliverable 2 to the change's plan as above — never into the flow doc.
3. **Fallback** (traced code belongs to no module, or the codebase has not adopted this framework): ask the user for a save path — never pick one silently.

## Conduct Rules

- Trace from real source every time. A spec not backed by reads is a liability, not a deliverable.
- One entry symbol per run unless the user asks to map several. The main path is the readable spine — but branches and **every caller of a shared symbol MUST be enumerated** (Step 3.5), never pruned to keep the line clean. Only cross-cutting concerns (logging, DI, generic utilities) stay pruned.
- The guided dialogue follows the language of the user's input. (This document is in English; the conversation need not be.)
- This skill's output is the map, not the change. Stop after the flow doc is saved and wait for instruction before editing any traced file.
- When a call target is ambiguous, ask — do not guess and proceed silently.
