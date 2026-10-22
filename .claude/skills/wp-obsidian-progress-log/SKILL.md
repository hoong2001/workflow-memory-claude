---
name: wp-obsidian-progress-log
description: Record and read back a lightweight, expandable cross-project progress record in the user's central Obsidian vault — a project card plus one card per module (status, done work, next step) — so a project paused for a while can be resumed without re-reading everything, and nothing built gets lost from the system view. Two modes — LOG (draft this project's + its modules' snapshot from real memory, confirm, write to the vault) and RESUME (read the cards back, or show the project/module Base dashboards oldest-first). Use when the user says "log progress", "記進度", or asks where things stand across projects in the vault. Never suggest it unprompted — not everyone uses Obsidian. Do NOT use for the detailed in-project implementation record — that is /wp-module-save-implementation; this skill only keeps the shallow cards that link back to it.
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
project's own `project-memory/modules/*/impl/`, `plans/`, and `<name>-flow.md`
(saved by `/wp-module-save-implementation`). These cards only link back to it.

**Trigger is manual.** Never write to the vault on your own, and never prompt the user to log or
read back — not everyone uses Obsidian, so this skill runs only when the user invokes it.

The two `_…plans.md` files in **Layout** come from `.claude/hooks/project-memory-status.mjs` on any
machine with a vault path set.

**Vault path — the `vaultPath` value of the first of these config files that sets one** (the
hook's order; a value still holding the example's `<you>` placeholder counts as unset):
1. this skill's `references/vault-path.local.json` (machine-local, gitignored, never synced);
2. `~/.claude/progress-vault.json` (per user, every project on the machine).

**Neither sets one → do NOT guess or use a default** —
tell the user in one line to copy `references/vault-path.example.json` →
`references/vault-path.local.json` (same folder) and set their vault's absolute path, then stop
until they've done it. Everything lives under a `Project Progress/` folder inside that vault
(create it if missing) — see **Layout** below.

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
   fallback. Use the vault path resolved above.

## Layout in the vault

```
Project Progress/
├── Projects.base              top level — every project card, oldest-touched first
├── Modules.base               drill-down — every module card, grouped by project
├── _Live plans.md             hook-generated, all projects — read first in RESUME, never edit
└── <project>/                 one folder per project
    ├── _<project>.md          the project card (type: project-progress); leading _ sorts it first
    ├── _plans.md              hook-generated — never edit, never fold into the cards
    └── <module>.md            one module card per module (type: module-progress)
```

Name the project folder after the project root folder's name — the name the
`project-memory-status.mjs` hook files `_plans.md` under — and each module card after the module's
folder name, so re-logging updates cards in place instead of duplicating them.

---

## Mode A · LOG (write / update the cards)

1. **Gather** this project's real state — do not ask for what you can read:
   - **Modules — from the source of truth, the actual `project-memory/modules/*/` folders.** For each:
     infer its state from its own docs (`MODULE.md`, `<name>-flow.md`, whether `impl/` has records)
     → done / in-progress / planned, plus what it did recently and its next step. Record EVERY
     module found; absence from `project-memory/overview/system-overview-spec.md` is no reason to
     add it there (the overview is curated — `.claude/rules/workspace-update-memory.md` item 5b).
   - Recent work per module — latest files under that module's `impl/` and `plans/`;
     `git log` / `git status` for what changed this session.
   - **A module's blocker and next step are usually already written down**: the live plan's status
     header (`Blocked` + its `Detail` reason, `Building` + its `N/M`), its `> **Resume:**` line
     (`You now — …` · `Next — …`, the last handoff — every module's Next at once in
     `project-memory/project-memory-status.md`), and the `☐` rows in its `## Decisions & open items`
     table. Read them before inferring anything — an open `☐` IS a pending item, stated by the
     person who parked it.
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
   - <what was accomplished> · deep record: `project-memory/modules/<module>/impl/<file>.md`

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
   The embedded `![[Modules.base#This project]]` scopes itself to the current project through the
   base's `this.project` filter. Claude cannot see Obsidian render it: the first time a project
   card is created, the handoff (step 5) asks the user to open it and confirm the module table
   appears; not rendered → replace the embed with plain wikilinks to each module card under
   `## Modules`.
4. **Ensure both Bases exist** at `Project Progress/` (create per `obsidian:obsidian-bases` if
   missing):
   - **`Projects.base`** — table over `type == "project-progress"`, sorted `last_touched` ascending
     (oldest first, so the most-forgotten float up), columns `project`, `status`, `last_touched`,
     `next_step`.
   - **`Modules.base`** — table over `type == "module-progress"`, sorted `last_touched` ascending,
     columns `module`, `status`, `last_touched`, `next_step`. Two views: **"By project"** grouped
     by `project` (for opening standalone), and **"This project"** filtered `project == this.project`
     (for embedding in a project card).
5. **Close with the handoff** — the **Handoff** section of `.claude/skills/_shared-conventions.md`:
   Done = every card and Base written, by vault path. Logging leaves nothing behind it, so
   this run is closed (`└─ 🏁 Closed  nothing pending`) — the project card's `next_step` belongs to
   the project, not to this run, and is not repeated as a Next. Only when this run created a project
   card is it open: You now = open that card and confirm the module table appears.

## Mode B · RESUME (read back)

- **First, `Project Progress/_Live plans.md`** (see **Layout**), when it exists — it is
  always current, while the cards are only as fresh as the last LOG.
- **One project:** read its `_<project>.md` card, then the module cards in the same folder; report
  briefly — overall `status` · each module's state + next step · the project's next step. Offer to
  open the deep record a module links to.
- **All projects:** point the user at `Project Progress/Projects.base` (top level, oldest-first)
  and `Modules.base` (drill-down, grouped by project). Surface the stalest first so forgotten work
  shows up.
