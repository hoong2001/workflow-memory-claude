# `docs/` — shared files no single module owns

Files that touch several modules without belonging to any one of them: a vendor API guide two
modules call, a business-rule document spanning the order and stock modules, a diagram several
flows share, a spec exported by another team.

## Where a file goes

| The file is… | Folder |
|---|---|
| owned by one module | that module's `references/` (`.sql` → its `schema/`) |
| shared by several modules, owned by none | here |
| about the system as a whole (feeds the overview spec) | `project-memory/overview/references/` |
| material for a one-off task | `project-memory/tasks/<date>-<slug>/` |

A file that turns out to belong to one module moves into that module's `references/`.

- **Read on demand** — never auto-loaded, never `@import`ed (files may be large or binary).
- Committed to git like the rest of `project-memory/`, so no credentials (`.claude/rules/workspace-no-secrets.md`).
- Drop files straight in and keep original filenames; a subfolder is fine when a set of files belongs together.
- A module that leans on a file here lists it under External links in its `references/_README.md`
  (relative path), so it is found from the module side. Never copy it into the module.

## External links

A file can't be a URL — paste shared external links here:
- `<label>` — <url>
