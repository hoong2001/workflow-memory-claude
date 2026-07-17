# schema/ — database table schemas (.sql)

The `.sql` table definitions this module does CRUD on.
- Source: provided by you.
- Keep them current — Claude consults these when writing data-access (Repository) code.
- One file per table or one combined file, whatever you provide. Keep the original filenames.

## test/ — test SQL scripts (generated)

CRUD-only seed / verify / cleanup scripts produced by `/workspace-auto-test-loop`,
named `<name>-<date>-<slug>.sql` to match the plan they verify. Kept so the same
check can be re-run later instead of being rewritten.
