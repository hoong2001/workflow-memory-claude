---
name: wp-obsidian-progress-log
description: Record and read back a lightweight, expandable cross-project progress record in the user's central Obsidian vault — a project card plus one card per module (status, done work, next step) — so a project paused for a while can be resumed without re-reading everything, and nothing built gets lost from the system view. Two modes — LOG (draft this project's + its modules' snapshot from real memory, confirm, write to the vault) and RESUME (read the cards back, or show the project/module Base dashboards oldest-first). Use when the user says "log progress", "記進度", "收工", "where was I", "what's pending", "還有什麼未做", "resume this project", or opens a project after a gap. Do NOT use for the detailed in-project implementation record — that is /wp-module-save-implementation; this skill only keeps the shallow cards that link back to it.
---

# Obsidian Progress Log — cross-project state board

Keeps a lightweight, **expandable** record in the user's central Obsidian vault: a summary card
per project and — one level down — a separate card per module, aggregated by two Base views. So a
paused project, what each of its modules has built, and its next step surface at a glance, without
opening every project or cramming everything into one flat note.

**Two levels (both shallow):**
- **Project card** — what the project is · overall status · one-line next step · a rolled-up view
  of its modules.
- **Module card** — one module's state · what it recently did · its next step · a link back to the
  deep record.

Done work counts, not just to-dos. The deep record — how it was built and why — stays in the
project's own `.claude/modules/*/impl/`, `plans/`, and `<name>-flow.md`
(saved by `/wp-module-save-implementation`). These cards only link back to it.

**Trigger is manual.** Never write to the vault on your own. At most, REMIND the user in one line
when a moment fits (task wrapped up → "want me to log progress?"; opening a stale project → "this
project has cards — read them back?"). The user decides.

**Vault path — read it from this skill's own config: `references/vault-path.local.json`**
(machine-local, gitignored, never synced). Read its `vaultPath` value; never hardcode a path in
the skill body. **If that file is missing, do NOT guess or use a default** — tell the user in one
line to copy `references/vault-path.example.json` → `references/vault-path.local.json` (same
folder) and set their vault's absolute path, then stop until they've done it. Everything lives
under a `Project Progress/` folder inside that vault (create it if missing) — see **Layout** below.

**Under the hood, reuse the global Obsidian skills** — do not reinvent them:
`obsidian:obsidian-cli` (read/create/append notes), `obsidian:obsidian-markdown` (note format),
`obsidian:obsidian-bases` (the `.base` views).

**Writing is dual-track — detect per machine, never assume (this skill is portable):**
1. **CLI present** (`obsidian` on PATH) → prefer it, via `obsidian:obsidian-cli`. It keeps
   Obsidian's index in sync and unlocks daily-note / backlink / search commands. Obsidian must
   be running. On Windows, a shell opened *before* the CLI was enabled in Settings → General
   carries a stale PATH — refresh it from the registry, or just use a fresh terminal; no reboot
   needed.
2. **CLI absent** → fall back to writing the notes and the `.base` files directly to the vault
   folder with normal file tools. The vault is plain Markdown, so this is a sanctioned, equivalent
   fallback. Use the vault path from `references/vault-path.local.json` — never hardcode it.

Either track still obeys Step 3: never write to the vault before the user confirms the draft.

## Layout in the vault

```
Project Progress/
├── Projects.base              top level — every project card, oldest-touched first
├── Modules.base               drill-down — every module card, grouped by project
└── <project>/                 one folder per project
    ├── _<project>.md          the project card (type: project-progress); leading _ sorts it first
    └── <module>.md            one module card per module (type: module-progress)
```

Use a STABLE project name (from the working dir / repo name / root `CLAUDE.md` title) as the folder
name, and each module's own folder name for its card — so re-logging updates cards in place instead
of duplicating them.

---

## Mode A · LOG (write / update the cards)

1. **Gather** this project's real state — do not ask for what you can read:
   - **Modules — from the source of truth, the actual `.claude/modules/*/` folders.** For each:
     infer its state from its own docs (`MODULE.md`, `<name>-flow.md`, whether `impl/` has records)
     → done / in-progress / planned, plus what it did recently and its next step. Record EVERY
     module found. Absence from `.claude/overview/system-overview-spec.md` is NOT an error and must
     never be "backfilled" on that basis — the overview is curated; some modules exist only for a
     bug fix and rightly never appear there.
   - Recent work per module — latest files under that module's `impl/` and `plans/`;
     `git log` / `git status` for what changed this session.
2. **Auto-draft both levels and show them for a yes** before writing anything:
   - one **module card** per module (its status · done · next · blocker), and
   - the **project card** (overall status · the single most important next step across modules).
   Never write to the vault before this confirmation.
3. **Write** via the dual-track above — create notes if new, update frontmatter + sections if they
   exist. Same project folder + same file names, so nothing duplicates.

   **Module card** — `Project Progress/<project>/<module>.md`:
   ```markdown
   ---
   type: module-progress
   project: <project>
   module: <module>
   status: in-progress
   last_touched: <YYYY-MM-DD>
   next_step: <one concrete line>
   tags:
     - module-progress
   ---

   ## Next step
   <the one actionable thing for this module>

   ## Done recently
   - <what was accomplished> · deep record: `.claude/modules/<module>/impl/<file>.md`

   ## Blockers
   <blocker or "none">

   ## Log
   - <YYYY-MM-DD> <one line>
   ```

   **Project card** — `Project Progress/<project>/_<project>.md`:
   ```markdown
   ---
   type: project-progress
   project: <project>
   status: active
   last_touched: <YYYY-MM-DD>
   next_step: <the single most important next step across the project>
   tags:
     - project-progress
   ---

   ## Next step
   <one line>

   ## Modules
   ![[Modules.base#This project]]

   ## Log
   - <YYYY-MM-DD> <one line of the session at project level>
   ```

   `last_touched` = today (real date, never invented). Append to `## Log`; don't erase history.
   The embedded `![[Modules.base#This project]]` is meant to auto-scope to the current project via
   the base's `this.project` filter — **verify it renders when you create it**; if `this`-based
   filtering isn't supported in the installed Obsidian version, fall back to plain wikilinks to
   each module card under `## Modules`.
4. **Ensure both Bases exist** at `Project Progress/` (create per `obsidian:obsidian-bases` if
   missing):
   - **`Projects.base`** — table over `type == "project-progress"`, sorted `last_touched` ascending
     (oldest first, so the most-forgotten float up), columns `project`, `status`, `last_touched`,
     `next_step`.
   - **`Modules.base`** — table over `type == "module-progress"`, sorted `last_touched` ascending,
     columns `module`, `status`, `last_touched`, `next_step`. Two views: **"By project"** grouped
     by `project` (for opening standalone), and **"This project"** filtered `project == this.project`
     (for embedding in a project card).

## Mode B · RESUME (read back)

- **One project:** read its `_<project>.md` card, then the module cards in the same folder; report
  briefly — overall `status` · each module's state + next step · the project's next step. Offer to
  open the deep record a module links to.
- **All projects:** point the user at `Project Progress/Projects.base` (top level, oldest-first)
  and `Modules.base` (drill-down, grouped by project). Surface the stalest first so forgotten work
  shows up.
