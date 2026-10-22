# Optional diagram (archify)

`/wp-module-code-trace-flow` and `/wp-module-technical-design` offer one interactive diagram at the
end of a run, before the handoff. The text (and the Mermaid block in `<name>-flow.md`) stays the
source of truth; the diagram is for people and is never read back as a source.

- **Only when `archify` is in the available-skills list.** It is a personal skill, not part of this
  template — absent, skip this section without a word.
- **Ask once, never draw unasked.** One diagram costs roughly 15–25k tokens (archify reads its
  schema, example and authoring rules, writes typed JSON, then runs browser-backed checks). Ask
  through `AskUserQuestion` (**Question pattern** in `.claude/skills/_shared-conventions.md`), with
  "No diagram" as the recommended option.
  The skill that calls this section names the diagram options.
- **On yes,** invoke the `archify` skill. Hand it the source the calling skill names (the Mermaid
  block, or the plan's Class & file map) and, as its output location, the folder
  `project-memory/modules/<name>/diagrams/` — archify creates its own `<type>-<slug>-<timestamp>/`
  folder inside it.
- **Link it, one line,** where the calling skill says: `Diagram: diagrams/<folder>/<file>.html — <type>, <date>`.
  The HTML is a Done leaf of the handoff.
