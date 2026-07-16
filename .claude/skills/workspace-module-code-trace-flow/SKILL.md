---
name: workspace-module-code-trace-flow
description: Trace a feature's call chain through the codebase by reading real source, then produce a flow spec (flow.md) covering the flow overview, call chain, touched files, and a concrete "where to cut" section for the intended change. Use this skill when the user wants to modify or extend an existing feature but does not yet know where in the code to start — e.g. "add a display field", "change this behavior", "where do I touch for...", "trace this feature", or any maintenance task that needs the code mapped before editing. Do NOT trigger for greenfield work with no existing code to trace, or for trivial one-line edits whose location is already known.
---

# Code Trace Spec — Feature-to-Flow Mapping

## Core Idea

In maintenance, the hard part is never editing code — it's knowing *where to cut*. This skill does not make the change itself; it starts from a feature or method name, traces the call chain bidirectionally through the **actual source** (grep/read, never recall), and produces a `flow.md` that ends in a concrete "where to cut" recommendation for the user's intended change.

A spec built from memory is worthless and dangerous. **Every link in the chain must be backed by a file the skill actually read.** If a link can't be verified in source, it is marked as a gap, not guessed.

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
- If the user says "just map it, no specific change yet" — accept it, skip the cut-recommendation tailoring, and note in the spec that the cut section is general.

### Step 1: Locate the entry symbol in source

Grep for the supplied method/feature name — **within the scope hint if one was given**, otherwise codebase-wide. Confirm the real definition before tracing. If multiple matches survive (common with generic names like `Save` / `GetData` / `Process`), list them with their file paths and ask which one — do not silently pick.

### Step 2: Trace upstream to the input boundary

From the entry symbol, follow callers upward until reaching a controller / handler / UI event / consumer. Record each hop as `file:method`. Stop at the input boundary.

### Step 3: Trace downstream to the output boundary

From the entry symbol, follow callees downward through the process layers until reaching persistence / external call / output. Record each hop as `file:method`. Stop at the output boundary.

### Step 4: Assemble and produce flow.md

Combine both directions into a single input → process → output chain, group the touched files by layer, and write the tailored "where to cut" section for the Step 0 change. Then save (see Save Workflow).

## Verification Rule

**No link without a source read.** For every `file:method` in the chain:

- It must come from a file the skill actually opened or grepped during this run.
- If a call target cannot be resolved in source (dynamic dispatch, reflection, config-driven wiring, generated code), mark it `unverified` with a one-line reason — never paper over it with a plausible guess.
- Substituting recalled framework knowledge for an actual read is the primary failure mode this skill exists to prevent.

## Output Template

Produce a file named `flow.md` (or named after the feature, e.g. `flow-<feature>.md`), following this structure.

```markdown
# Flow Spec: [Feature Name]

> Created: YYYY-MM-DD
> Entry symbol: `file:method`
> Intended change: [from Step 0, or "general mapping"]

## 1. Overview

[One or two sentences: what this flow does, what goes in, what comes out.]
- **Input:** ...
- **Output:** ...

## 2. Call Chain

Main data path only, input → process → output:

1. `path/File.ext : Method()` — [one-line role]
2. `path/File.ext : Method()` — [one-line role]
3. ...

> Cross-cutting (noted, not expanded): logging via …, DI via …

## 3. Touched Files (by layer)

| Layer | File | Why it's in the flow |
|-------|------|----------------------|
| Entry (input) | ... | ... |
| Process | ... | ... |
| Persistence/Output | ... | ... |

## 4. Where to Cut

For the intended change ([from Step 0]), the actual edit points:

- [ ] `path/File.ext : Method()` — [what to add/change here]
- [ ] ...

> Unverified links (could not be resolved in source):
> - `...` — [reason]
```

Section 4 is the payoff of the whole spec. Sections 1–3 exist to make section 4 trustworthy.

## Save Workflow

After the user confirms `flow.md`, persist it to a real file. Decide the path in this order:

1. **Establish the project root** for the codebase being traced.
2. **Detect a `.code-workspace`** file; if found, offer to save relative to it.
3. **Present save-path options** to the user (workspace-relative location, project root, or a custom folder/filename) — never pick a path silently.

Default filename: `flow.md`. Offer `flow-<feature>.md` when multiple flows may coexist in one folder.

## Conduct Rules

- Trace from real source every time. A spec not backed by reads is a liability, not a deliverable.
- One entry symbol per run unless the user asks to map several. Keep the chain to the main data path.
- The guided dialogue follows the language of the user's input. (This document is in English; the conversation need not be.)
- This skill's output is the spec, not the change. Stop after `flow.md` is saved and wait for instruction before editing any traced file.
- When a call target is ambiguous, ask — do not guess and proceed silently.
