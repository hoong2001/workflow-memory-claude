# SQL House Style — Schema & Seed Scripts

Scope: `.sql` files — table/view definitions and seed/reference-data scripts. Runtime data
access (Dapper queries, parameterization, transactions) is governed by the
`workspace-concrete-repository-pattern` skill, not this rule.

## 1. Seed scripts are plain INSERTs

Write `INSERT INTO ... VALUES (...)`. Do NOT add `IF NOT EXISTS` / `NOT EXISTS` guards,
`MERGE`, or `INSERT ... SELECT` patterns unless the user explicitly asks for them.

**Why:** these scripts are run once, deliberately, by a person who already knows the state
of the target database. Defensive guards make the script harder to read and hide the fact
that it silently did nothing.

## 2. Read the real definition before writing SQL against it

Before designing anything on top of a view or table, read its ACTUAL current definition —
the `.sql` in the module's `schema/` folder, or the live database object. Never infer a
schema from a sibling module or an earlier design document, and never rely on recall.

**Why:** the user hand-edits views. Their local edit is the source of truth; a design
derived from a sibling report drifts from it and every round of "fix the columns" is a
round that a single read would have prevented.

**How to apply:** echo back the exact column list you are relying on before writing the
query, so a mismatch surfaces in one cheap confirmation instead of after implementation.

## 3. A seed script is a delivered file, never prose

If a module needs seed / reference data, ship it as a real `.sql` file under that module's
`schema/` folder. Describing the inserts in a plan, an implementation record, or a chat
reply does NOT count as delivering them.

**Why:** a described script is indistinguishable from a finished one in a status report,
so the gap only surfaces at deployment time.
