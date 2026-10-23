# references/ — reference materials for the WHOLE system

Supporting material about the system as a whole (not tied to any single module):
architecture diagrams, domain docs, external standards, vendor specs, whole-system screenshots, etc.

- Source: provided by you.
- **Read on demand** — Claude consults these when working at the system level; they are NOT
  auto-loaded (may be large or binary, so never `@import` them).
- Drop files straight in, images included. Keep original filenames.
- **The whole-system spec** lands here as `spec-<YYYY-MM-DD>-<slug>.md` — the input to
  `/wp-system-overview-spec-generator`. Write your own from `.claude/skills/_system-spec-template.md`,
  or run `/wp-system-spec-discuss` to talk one into being. It stays after the bootstrap: each
  module's `MODULE.md` points back to the capabilities it owns.
- Module-specific references go in that module's `project-memory/modules/<name>/references/` instead.
- Files several modules share but none owns go in `project-memory/docs/`.

## External links
A file can't be a URL — paste external links here:
- `<label>` — <url>
