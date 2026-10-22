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

`.claude/hooks/block-secrets.mjs` denies a call whose incoming text carries a credential; its
header owns the matcher, the guarded and exempt paths, and fail-open. It never scans `old_string`,
so an edit that redacts a secret already on disk goes through.

Blocked by it → replace the value with a placeholder and rewrite; the same value never goes
through another tool.

## Backfilling what predates the guard

`/wp-secret-scan` sweeps every file the hook guards for credentials written before the hook
existed. A hit that is already committed needs more than an edit — rotate the credential,
because git history still holds the old value.
