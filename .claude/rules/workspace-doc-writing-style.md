---
paths:
  - "project-memory/**"
  - ".claude/**/*.md"
  - "*.md"
---

# Document Writing Style (path-scoped — loads when a matching file is read or written)

> Read this BEFORE writing or editing any document under `project-memory/` or `.claude/`, plus root
> `README.md` / `CLAUDE.md`. It does NOT govern chat replies — response tone and
> language belong to the user's own output style or personal `CLAUDE.md`.

**Language: English** — the document, and the code and comments it quotes.

**Two readerships, two depths.** Steering files — `.claude/rules/`, `.claude/skills/`, root
`CLAUDE.md` — are read by the agent alone and also follow `wp-writing-for-agents`: every line must
change behaviour, so explanation the model already knows is cut. Documents under `project-memory/`
are read by people too: they keep the explanation and the reasons a reader with no prior context
needs. The rules below apply to both.

## Rules

- **Open with the fact.** No "Here's the thing", "It turns out", "It's worth noting".
- **Cut empty qualifiers** — really, just, simply, actually, fundamentally, basically —
  and business jargon (deep dive, leverage, navigate, landscape, game-changer).
- **Active voice, named actor.** "The decision was reached" and "the data tells us" hide
  who acted; write "we chose X because Y". Critical in impl records: an unowned decision
  is one no future session can reopen.
- **Specific over impressive.** Name the implication, the file, the count — never
  "several places", "various issues", "the implications are significant".
- **State the conclusion, not the contrast.** "Not X, it's Y" → "Y".
- **No pull-quotes.** If a line wants to be tweeted, rewrite it as a fact.

Em dashes are house punctuation for glossing a term; these are reference documents read in
fragments, so essay tuning (rhythm variation, list-length limits, prose scoring) does not apply.

## Diagrams

A section that has structure — a path, a set of relations, a movement of data — carries one Mermaid
diagram, and the prose after it takes ≤3 lines: the reason, a caveat, an `unverified` link. Prose
that restates the diagram is deleted.

| Document | Section | Diagram |
|---|---|---|
| Overview | §5 Module Composition | `flowchart` — how the modules depend on each other; a CRUD matrix (table) — which module creates, reads, updates and deletes each data entity |
| Overview | §6 External Integrations | `flowchart` — what crosses each boundary |
| `MODULE.md` | Public interface / dependencies | `flowchart` — callers → this module → its dependencies |
| `<name>-flow.md` | Diagram | `sequenceDiagram` of the main path; a Data flow `flowchart` when the module reads or writes tables |
| `<name>-flow.md` | States | `stateDiagram-v2` per status field — its values and the method that makes each transition; `None` when the module has no status field |
| Plan | Touch points | `flowchart` — touched files grouped by layer; omitted at ≤2 rows |
| Plan | Class & file map, Data access | `flowchart` layered map; `flowchart` data flow |
| Plan | Data model | `erDiagram` — tables, keys and relationships; omitted when no table changes. A `stateDiagram-v2` per status field the change adds or changes |
| Impl | Change map | `flowchart` of the structural change; omitted for an internal-only change |

- **New documents carry the diagram; existing ones keep their shape.** A document that has no
  diagram gets none until the user asks; a diagram already there is patched in place when its facts
  change.
- **Every node and edge traces to a file, table or document read this task**; a link nothing
  confirms is labelled `unverified`.
- **Tables and `file:method` lists are data** — the 3-line cap leaves them alone (impl `Files
  touched`, plan `Decisions & open items` and `## Tasks`, flow `Called files & methods`, the
  overview's CRUD matrix).
- **Direction:** every `flowchart` is `TB` — a long chain grows taller, never smaller. `LR` only
  when the whole diagram holds ≤2 subgraphs, or is one short chain of ≤5 nodes.
- **Syntax:** `flowchart`, `sequenceDiagram`, `classDiagram`, `erDiagram` and `stateDiagram-v2` only; ≤12 nodes per diagram, more
  → split by layer; wrap a node label in double quotes when it holds `()`, `:`, `/` or `|`. A state
  is named as its constant, one word; each transition is labelled with the method that makes it.
