---
name: workspace-obsidian-progress-log
description: Record and read back a lightweight cross-project progress snapshot in the user's central Obsidian vault — what a project is, its modules and their state, what was done, and the next step — so a project paused for a while can be resumed without re-reading everything, and so nothing built gets lost from the system view. Two modes — LOG (draft this project's snapshot from its real memory, confirm, write to the vault) and RESUME (read the card back, or show the whole dashboard of projects oldest-first). Use when the user says "log progress", "記進度", "收工", "where was I", "what's pending", "還有什麼未做", "resume this project", or opens a project after a gap. Do NOT use for the detailed in-project implementation record — that is /workspace-module-save-implementation; this skill only keeps the shallow snapshot that links back to it.
---

# Obsidian Progress Log — cross-project state board

Keeps ONE lightweight card per project in the user's central Obsidian vault, aggregated into a
Base dashboard, so paused projects, what each has built, and its next step surface at a glance
instead of having to open every project to find out.

**What the card records (all shallow):** what the project is · its modules and each one's state ·
what was recently done · current status · one-line next step. **Not just to-dos** — done work
counts too. The deep record — how it was built and why — stays in this project's own
`.claude/modules/*/impl/`, `plans/`, and `<name>-flow.md`
(saved by `/workspace-module-save-implementation`). The card only links back to it.

**Trigger is manual.** Never write to the vault on your own. At most, REMIND the user in one
line when a moment fits (task wrapped up → "want me to log progress?"; opening a stale project
→ "this project has a card — read it back?"). The user decides.

**Vault path — read it from this skill's own config: `references/vault-path.local.json`**
(machine-local, gitignored, never synced). Read its `vaultPath` value; never hardcode a path in
the skill body. **If that file is missing, do NOT guess or use a default** — tell the user in one
line to copy `references/vault-path.example.json` → `references/vault-path.local.json` (same
folder) and set their vault's absolute path, then stop until they've done it. Cards live under a
`Project Progress/` folder inside that vault (create it if missing).

**Under the hood, reuse the global Obsidian skills** — do not reinvent them:
`obsidian:obsidian-cli` (read/create/append notes), `obsidian:obsidian-markdown` (note format),
`obsidian:obsidian-bases` (the dashboard `.base` file).

**Writing is dual-track — detect per machine, never assume (this skill is portable):**
1. **CLI present** (`obsidian` on PATH) → prefer it, via `obsidian:obsidian-cli`. It keeps
   Obsidian's index in sync and unlocks daily-note / backlink / search commands. Obsidian must
   be running. On Windows, a shell opened *before* the CLI was enabled in Settings → General
   carries a stale PATH — refresh it from the registry, or just use a fresh terminal; no reboot
   needed.
2. **CLI absent** → fall back to writing the note and the `.base` file directly to the vault
   folder with normal file tools. The vault is plain Markdown, so this is a sanctioned,
   equivalent fallback. Use the vault path from `references/vault-path.local.json` (per the
   Vault path note above) — never hardcode it.

Either track still obeys Step 3: never write to the vault before the user confirms the draft.

## Identify the project

Derive a stable project name from the working directory / repo name (or the title in root
`CLAUDE.md`). Use the SAME name every time so the card updates in place instead of duplicating.
The card's note filename is the project name under `Project Progress/`.

---

## Mode A · LOG (write / update the card)

1. **Gather** this project's real state — do not ask for what you can read:
   - **Modules — from the source of truth, the actual `.claude/modules/*/` folders.** For each:
     infer its state from its own docs (`MODULE.md`, `<name>-flow.md`, whether `impl/` has
     records) → done / in-progress / planned. Record EVERY module found — the card is the
     complete inventory. Absence from `.claude/overview/system-overview-spec.md` is NOT an
     error and must never be "backfilled" on that basis: the overview is a curated system-level
     view, and some modules exist only for a bug fix or a small change and rightly never appear
     there. The card captures completeness; the overview stays curated.
   - Recent work — latest files under `impl/` and `plans/`; `git log` / `git status`.
2. **Auto-draft** the card:
   - `status` — active / paused / blocked / done (infer; ask only if genuinely ambiguous)
   - module list with each one's state
   - what was recently done (done work, not only pending) — 1–3 lines
   - `next_step` — ONE concrete actionable line; any blocker; path back to the deep record
3. **Show the draft and get a yes** — the user confirms or edits. Never write to the vault
   before this confirmation.
4. **Write** the card via `obsidian:obsidian-cli` — create the note if new, update frontmatter +
   sections if it exists. Card shape:

   ```markdown
   ---
   type: project-progress
   project: <project-name>
   status: paused
   last_touched: <YYYY-MM-DD>
   next_step: <one concrete line>
   tags:
     - project-progress
   ---

   ## Modules
   - <module> — <done / in-progress / planned> · `.claude/modules/<module>/`

   ## Done recently
   - <what was accomplished> · deep record: `.claude/modules/<name>/impl/<file>.md`

   ## Next step
   <the one actionable thing>

   ## Blockers
   <blocker or "none">

   ## Log
   - <YYYY-MM-DD> <one line of what happened this session>
   ```

   `last_touched` = today (get the real date; do not invent it). Append a new `## Log` line
   each time rather than erasing history.
5. **Ensure the dashboard exists** — if `Project Progress/Dashboard.base` is missing, create it
   per `obsidian:obsidian-bases`: a table over notes where `type == project-progress`, sorted by
   `last_touched` ascending (oldest first, so the most-forgotten float to the top), columns
   `project`, `status`, `last_touched`, `next_step`.

## Mode B · RESUME (read back)

- **One project:** read its card via `obsidian:obsidian-cli` and report, briefly,
  `status` · modules & state · what was last done · **next step**. Then offer to open the deep
  record it links to.
- **All projects (dashboard):** list every `type: project-progress` note, oldest `last_touched`
  first, showing project · status · next step — so stale/paused projects surface first. Point
  the user at `Project Progress/Dashboard.base` for the live view in Obsidian.
