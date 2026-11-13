# Database access (read-only catalog)

A skill that needs what only the database holds — a definition missing from the repo, a table's
columns and keys, the live shape of a view — reads it under this section. The skill that points
here names what to read; this section owns how.

## Ask first

Ask once per run and per database through the **Question pattern**
(`.claude/skills/_shared-conventions.md`), naming the server and database the project's config
points at — it may be production:

- **Read it from the database, read-only** — the yes covers this run and this database.
- **I run the script** — write the catalog query as a `.sql` to the module's `schema/` (a one-off
  task: its own `schema/`); the user runs it and saves the output there.
- **Leave it unverified** — the calling skill marks the fact `unverified — not read from the database`.

## Read-only connect

- **Connection** — the one the project's config names. Its connection string stays in the config
  and in the command; documents and chat lines carry the connection-string key
  (`.claude/rules/workspace-no-secrets.md`).
- **Catalog only** — `SELECT` on catalog views: `sys.objects`, `sys.columns`, `sys.indexes`,
  `sys.sql_modules`, `sys.foreign_keys`, `INFORMATION_SCHEMA`, `OBJECT_DEFINITION`. A data table
  is read only when the calling skill's task is about its rows and the user's yes named that table.
- **Save what was read** — each definition goes to the module's `schema/` as `.sql`, so the next
  run reads the file.
- **No SQL client on the machine, or the login is refused** → say which, and offer "I run the script".

## Writes stay with the user

A statement that changes the database — DDL, a data patch — is delivered as a `.sql` in
`schema/`; the user runs it.
