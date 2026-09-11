# No Secrets in Memory or Workflow Files — Placeholders Only

Never write a real credential into any document under `project-memory/` or `.claude/`, or into
any `.md` file. This covers passwords, API keys, access and refresh tokens, client secrets,
private keys, and any connection string that carries a live password.

**Why:** these files are committed to git, pushed to a public template repo, and synced across
machines and projects. A credential written here is not a local mistake — it is published, and
git history keeps it long after the "fix" commit deletes the line.

## How to apply

Write the placeholder, then name where the real value lives:

```
Connection string: Server=<SERVER>;Database=<DB>;User Id=<DB_USER>;Password=<PASSWORD>
Real value: Web.config of the Web project on the deployment server.
```

Accepted placeholders: `<REDACTED>`, `<PASSWORD>`, `<API_KEY>`, `${ENV_VAR}`, `***`,
`your-key-here`, `changeme`, `example`, `TODO`.

Describing a credential in prose is always fine — the ban is on the value, not the topic.
"The report API needs a bearer token, held in the ops vault" passes. So does naming a
secret's location precisely: `Web.config → connectionStrings/OpsDb`.

## The hook that enforces this

`.claude/hooks/block-secrets.ps1` runs as a `PreToolUse` hook on `Write`, `Edit`, `MultiEdit`,
`NotebookEdit`, `Bash`, and `PowerShell`, wired in `.claude/settings.json`. It scans only the
INCOMING text of a call and answers `permissionDecision: "deny"` on a match, with the value
masked in the reason so the secret never re-enters the conversation.

Four things it deliberately does NOT do:

- **It does not scan application code or config.** `Web.config`, `appsettings.json`, `.env` are
  out of scope — a connection string belongs there.
- **It does not scan `old_string`.** Redacting a secret already on disk stays possible.
- **It exempts its own toolkit** — `.claude/hooks/`, `.claude/skills/wp-secret-scan/`, and this
  file — because they quote the patterns they hunt for.
- **It fails open.** A script error, or a machine without `powershell`, allows the write and
  prints a warning. The hook is a safety net under this rule, never a substitute for it.

Blocked by it? Do not route around it with a different tool. Replace the value with a
placeholder and rewrite.

## Backfilling what predates the guard

`/wp-secret-scan` sweeps `project-memory/` and `.claude/` for credentials written before the
hook existed. A hit that is already committed needs more than an edit — rotate the credential,
because git history still holds the old value.
