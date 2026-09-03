# schema/ — every `.sql` file this module owns

All SQL files for this module live here, whatever produced them: table and view definitions,
indexes, constraints, seed and reference data. One folder, so anyone asking "what does this
module's database side look like" opens one place.

## Who puts what here

| Origin | What | Naming |
|---|---|---|
| You provide | Table/view definitions, indexes, constraints, or any other `.sql` you hand over | Keep the original filenames |
| Claude generates | Seed / reference-data scripts (`workspace-sql-house-style.md` rule 3) | `<name>-<date>-<slug>.sql`, matching the plan it belongs to |
| `/wp-auto-test-loop` generates | CRUD-only seed / verify / cleanup scripts | in `test/`, `<name>-<date>-<slug>.sql` |

The naming split is how you tell at a glance which files are yours: your originals keep their
own names, everything derived carries the module + date + slug convention already used by
`plans/` and `impl/`.

## Keeping it current

Claude reads these when writing data-access code, and `workspace-sql-house-style.md` rule 2
requires reading the real definition before designing anything on top of it. A stale file here
produces a design that drifts from the live database — so when you hand-edit a view or add an
index, update the file too. Your local edit is the source of truth; this folder is where it
becomes visible.

## test/ — test SQL scripts (generated)

CRUD-only seed / verify / cleanup scripts produced by `/wp-auto-test-loop`,
named `<name>-<date>-<slug>.sql` to match the plan they verify. Kept so the same
check can be re-run later instead of being rewritten.
