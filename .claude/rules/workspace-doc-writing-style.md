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
| Overview | §5 Module Composition | `flowchart` — modules and the data each owns |
| Overview | §6 External Integrations | `flowchart LR` — what crosses each boundary |
| `MODULE.md` | Public interface / dependencies | `flowchart LR` — callers → this module → its dependencies |
| `<name>-flow.md` | Diagram | `sequenceDiagram` of the main path; a Data flow `flowchart LR` when the module reads or writes tables |
| Plan | Touch points | `flowchart` — touched files grouped by layer; omitted at ≤2 rows |
| Plan | Class & file map, Data access | `flowchart` layered map; `flowchart LR` data flow |
| Impl | Change map | `flowchart` of the structural change; omitted for an internal-only change |

- **New documents carry the diagram; existing ones keep their shape.** A document that has no
  diagram gets none until the user asks; a diagram already there is patched in place when its facts
  change.
- **Every node and edge traces to a file, table or document read this task**; a link nothing
  confirms is labelled `unverified`.
- **Tables and `file:method` lists are data** — the 3-line cap leaves them alone (impl `Files
  touched`, plan `Decisions & open items` and `## Tasks`, flow `Called files & methods`).
- **Syntax:** `flowchart`, `sequenceDiagram` and `classDiagram` only; ≤12 nodes per diagram, more
  → split by layer; wrap a node label in double quotes when it holds `()`, `:`, `/` or `|`.
