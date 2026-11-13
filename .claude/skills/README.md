# Skills Map — order and when to use

> One glance at how the workflow skills connect. Each skill's own `SKILL.md` frontmatter
> already states its detailed purpose and "do NOT use" cases — this file is the **map between
> them**: what runs first, what's optional, and which skill answers "what do I reach for now?"

> Rules that several skills share — the purpose gate, the question pattern, interview pacing, the handoff block, the recorded-decisions read — live once in
> `.claude/skills/_shared-conventions.md`, and the status header in `.claude/skills/_status-header.md`; the skills point at them instead of each carrying a copy.
> The whole-system spec format lives the same way in `.claude/skills/_system-spec-template.md`: `system-spec-discuss`
> writes it, `system-overview-spec-generator` reads it.

> Documents under `project-memory/` carry Mermaid diagrams — one per section that has structure,
> ≤3 lines of prose after it — per **Diagrams** in `.claude/rules/workspace-doc-writing-style.md`.
> The optional archify HTML (`.claude/skills/_optional-diagram.md`) is a separate, asked-once extra.
> A skill that reads the live database (`code-trace-flow`, `wp-database-design`) does it under `.claude/skills/_database-access.md`.

## Trigger convention

- **User-invoked** (`disable-model-invocation: true`) — only you can run these: type `/wp-<name>`. The agent never fires them; where a rule names one, it tells you to run it, and the wrap-up reminders name the full command to type (`/wp-module-save-implementation`, `/wp-retro`, `/wp-task-record`). `module-save-implementation`, `task-record`, `retro`, `system-spec-discuss`, `system-overview-spec-generator`, `update-from-master`, `secret-scan`, `connstr-check`, `packageref-to-packages-config`, `obsidian-start`.
- **User-triggered** (model-invocable, never auto-run) — you type `/skill-name`, or ask in words and the agent fires it. Everything in the build chain, `wp-interview`, and `wp-obsidian-progress-log` — the Obsidian skill is never reminded, only invoked.
- **Auto-triggered** — the agent reaches for these on its own when the work matches. The coding-standard skills (`repository-unitofwork-pattern`, `database-design`, `csharp-gof-design-patterns`, `aspnet-mvc-frontend-standards`) the steering-file writing standard (`writing-for-agents`), `wp-tfvc` in a TFVC workspace, and `wp-git` — which only proposes; every tier 2 and tier 3 operation waits for your answer.

## The main flow (module work)

```
                          ┌─ (legacy code, no docs) ──► code-trace-flow ─┐
requirement ──────────────┤                                              ├──► plan in plans/
                          └─ (goal, clear or fuzzy) ──► plan-discuss ─────┘
                                                              │
             (needs the cut + a task list?) ──► technical-design ──┐ appends Technical
                                                              │        │ Design + Tasks to
                                                              │        │ the SAME plan file
                                                              │◄───────┘
                                   ┌──────────────────────────┘
                                   ▼
   code → build → test  ◄── coding standards auto-apply here:
   (Claude builds, fixes or    repository-unitofwork-pattern (DAL)
    stops to ask; user tests)  database-design (any SQL, tables, keys, ownership)
                               csharp-gof-design-patterns (design / refactor)
                               aspnet-mvc-frontend-standards (UI)
                                   │
                                   ▼
                          save-implementation  (wrap up: impl record + sync plan + refresh flow.md)
                                   │
                                   ▼  only when the wrap-up names a friction signal
                          retro  (fix the environment: pointer · check · rule — you pick)
```

**A new system, or a new area spanning several modules of a live one** runs upstream of all of the above:
`system-spec-discuss` (only if no spec exists yet) → `system-overview-spec-generator` (first bootstrap, or an expansion re-run that grows the overview in place) → each module through the main flow.

**Only an idea or a problem, no requirement yet** — `interview` runs first and ends in a confirmed goal,
routed to one of the entry points above or to a one-off task.

> The build, the Decision check and the manual test need no skill — `.claude/rules/workspace-workflow.md` Step 2, with the build and the Decision check in `.claude/rules/workspace-build-loop.md` (path-scoped to code files).
>
> Hooks need no skill either — `.claude/hooks/`, wired in `.claude/settings.json`; each file's header owns its behaviour.

## Quick "what do I reach for?" forks

- **Only an idea or a problem, don't know where to start** → `interview` (ends in a confirmed goal and the command to type next).
- **New requirement, no plan yet** → `plan-discuss` (always; it's the only door).
- **Existing feature, don't know where the code is** → `code-trace-flow` first, then `plan-discuss`.
- **Plan done, need API/class/SQL detail, or a task breakdown, or both** → `technical-design` (it does the cut and the task list in one pass).
- **Should this calculation be in the query or the service?** → `database-design` (`wp-database-design/references/query-design.md`, the row-count test).
- **New table, new column, or who may write a shared table?** → `database-design` (conventions, ownership, the plan's Data model).
- **Should this be a Strategy / Factory / some pattern?** → `csharp-gof-design-patterns` (no named pain, no pattern).
- **Plan done, builds in one pass** → just code; skip `technical-design`.
- **Done coding a milestone** → type `/wp-module-save-implementation` (your trigger, not the agent's).
- **The session fought you — rebuilds, repeated corrections, a long hunt for one fact** → type `/wp-retro` (fixes the workflow so it does not recur; the code is not its job).
- **Resuming this project after a gap / "where was I?"** → `project-memory/project-memory-status.md`, then the live plan's `> **Resume:**` line.
- **Where do all my projects stand?** → `wp-obsidian-progress-log` (RESUME), or type `/wp-obsidian-start` if unsure which Obsidian skill you need.
- **One-off check, report or data patch, nothing ships into the system** → type `/wp-task-record` at the start: it clarifies, does the work and records it (no module layer, no Step 3).
- **Brand-new system, or a new area spanning several modules of a live one** → type `/wp-system-spec-discuss` (if needed) → `/wp-system-overview-spec-generator`, then per-module main flow.
- **The session-start notice says the master template is newer** → type `/wp-update-from-master` (syncs by `SYNC-MANIFEST.md`, never a bulk copy).
- **Worried a password or API key made it into the docs** → type `/wp-secret-scan`.
- **Config files edited outside Claude, or connection strings all over the place** → type `/wp-connstr-check`.
- **Commit, push, branch, stash or undo in git — or a new folder with no version control** → `wp-git` (it asks before anything outward or destructive).
- **Project is in TFVC, not git — check in, get latest, shelve, merge (which branch → which)** → `wp-tfvc`.
- **A .NET Framework project uses `PackageReference` and must switch to `packages.config`** → `wp-packageref-to-packages-config`.
