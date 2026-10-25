---
paths:
  - "**/*.sql"
---

# SQL House Style — Schema & Seed Scripts

Scope: `.sql` files — table/view definitions and seed/reference-data scripts.

## 1. Seed scripts are plain INSERTs

Write `INSERT INTO ... VALUES (...)`. Do NOT add `IF NOT EXISTS` / `NOT EXISTS` guards,
`MERGE`, or `INSERT ... SELECT` patterns unless the user explicitly asks for them.

**Why:** these scripts are run once, deliberately, by a person who already knows the state
of the target database. Defensive guards make the script harder to read and hide the fact
that it silently did nothing.

## 2. Read the real definition before writing SQL against it

Moved to `wp-sql-query-design` → **Read the real definition first** — it applies to every piece of SQL.

## 3. A seed script is a delivered file, never prose

If a module needs seed / reference data, ship it as a real `.sql` file under that module's
`schema/` folder — the single home for every `.sql` the module owns, provided or generated
(see `project-memory/modules/example-module/schema/_README.md`). Name a generated script `<name>-<date>-<slug>.sql` to match
its plan, so it is distinguishable from the files the user provided. Describing the inserts in a plan, an implementation record, or a chat
reply does NOT count as delivering them.

**Why:** a described script is indistinguishable from a finished one in a status report,
so the gap only surfaces at deployment time.
