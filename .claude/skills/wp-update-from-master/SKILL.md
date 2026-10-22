---
name: wp-update-from-master
description: Sync workflow-template updates from the master workflow-memory-claude repo into the current project, strictly following the master's SYNC-MANIFEST.md whitelist. By default git-clones the master fresh (URL/branch from SYNC-MANIFEST.md's Master source block); a local master path is the offline/test fallback. Use when the user says "sync from master", "update the template", "pull template updates" (in any language). Do NOT use for syncing project → master (improvements flow back by hand), and NEVER as an excuse to bulk-copy the whole .claude/ or project-memory/ tree.
---

# Update From Master — Template Sync (project side)

Pull template updates from the master `workflow-memory-claude` repo into the current
project. The master's `SYNC-MANIFEST.md` is the single source of truth for what may
be copied; this skill is the executor, not the policy.

**Hard safety rules (non-negotiable):**
- NEVER copy the whole `project-memory/` tree, the whole `.claude/` tree, or the repo root wholesale.
- NEVER delete files in the target that don't exist in the master (no mirror/`robocopy /MIR` semantics) — projects may have added their own rules/skills. ONLY exception: paths explicitly listed in the master manifest's 🗑️ Renames / deletions section, removed after user confirmation (Step 4b) — otherwise renamed/merged skills linger and keep auto-triggering alongside their replacements.
- NEVER write to a path in the master manifest's 🚫 table (real modules, the overview, shared docs, task records) — inside those folders only the ✅ `_README.md` files are copied.
- Grey-zone files are merged with user confirmation, never mechanically overwritten.

## Step 1 · Get the master (git clone by default)

The master is pulled fresh from git, so there is no machine-specific path to maintain.

1. **Read the source** from the target project's **local** `SYNC-MANIFEST.md` → "📦 Master
   source" block: `$repo` = its `Repo` row, `$branch` = its `Branch` row. Offer them as the
   default; let the user override the URL/branch if they say so.
2. **Shallow-clone** it into a fresh temp directory (deleted in Step 6):

   ```powershell
   $master = Join-Path $env:TEMP ("wmc-master-" + [guid]::NewGuid().ToString('N'))
   git clone --depth 1 --branch $branch $repo $master
   ```

   If the clone fails (no network, bad URL), report the exact error and offer the local
   fallback below — never proceed with a half-cloned tree.
3. **Local fallback** (offline, or testing an unpushed master): if the user asks to sync
   from a local master folder instead, skip the clone and ask for that path.

Then validate the master (clone OR local path) before proceeding — ALL must pass, else stop:
1. It contains `SYNC-MANIFEST.md` at its root.
2. It contains `.claude/rules/` and `.claude/skills/`.
3. The current project is **not the master itself** — if the project's
   `git remote get-url origin` equals the master URL, this repo IS the master; syncing onto
   itself is a no-op. Warn and stop.

### Known environment issues (handle these, never rediscover them)

These have each cost a run before. Treat them as part of the procedure, not as surprises:

- **The clone may download objects without populating the working tree** (`GIT_DIR` /
  `GIT_WORK_TREE` leaking in from the parent shell). After cloning: clear both, force a
  checkout, and assert the tree is non-empty **before** any diff. An empty tree is a hard
  stop, not a warning.

  ```powershell
  Remove-Item Env:GIT_DIR, Env:GIT_WORK_TREE -ErrorAction SilentlyContinue
  git -C "$master" checkout -f HEAD
  if (-not (Get-ChildItem -Force "$master" | Where-Object Name -ne '.git')) {
      throw "Clone left an empty working tree — stop, do not diff."
  }
  ```

- **Quote every path.** The master temp path and the target project path may both contain
  spaces; an unquoted path fails or, worse, resolves to the wrong depth.
- **Never combine copy and delete in one command.** The permission layer misresolves
  multi-action path commands — run them as separate steps (Step 4 then Step 4b).
- **Run the Step 5b alignment scan with `--no-ignore`.** The TARGET project's `.gitignore`
  may hide `.md` / `.claude` from ripgrep even when the master's does not, which makes the
  scan silently find nothing and report "aligned".

## Step 2 · Read the manifest (SSOT)

Read `SYNC-MANIFEST.md` **from the freshly cloned master** (not the target's local copy —
the clone is the newest by definition). Its ✅ / 🚫 / ⚠️ categories drive everything below.
If the manifest lists paths this skill doesn't mention, follow the manifest.

## Step 2.5 · Version pre-check (fast path)

Compare versions before doing the full content diff:

1. Read the **target's local** `SYNC-MANIFEST.md` → 📦 Master source table → `Version` row.
   Missing (a project synced before versioning existed) → treat as unknown and go straight
   to Step 3 — there is nothing to compare yet.
2. Compare it to the **freshly cloned master's** Version (read in Step 2).
3. **Equal** → report `Target already at vX.Y.Z — no template changes to pull.` and stop
   here. Offer to run the full diff anyway if the user wants to be sure — the version is
   advisory (it tracks commits, not a content hash), so Step 3 stays the ground truth
   whenever there is any doubt.
4. **Different, or target has no Version row** → proceed to Step 3 as normal, carrying both
   numbers (`vX.Y.Z → vA.B.C`, or `none → vA.B.C`) into the Step 3 report and the Step 6 summary.

This step only short-circuits the "nothing changed" case. It never substitutes for Step 3
when versions differ or the target predates versioning.

## Step 3 · Pre-flight report

Before copying anything, show the user a dry-run summary:
- ✅ paths that will be overwritten (list files that actually differ, not everything — compare content or timestamps)
- 🆕 files that exist only in master (will be added)
- 🗑️ target paths that appear on the manifest's Renames / deletions list (will be deleted in Step 4b — show the old → new mapping so the user sees what replaces each)
- 🧩 files that exist only in the target's `rules/`/`skills/` AND are not on the deletions list (project-own additions — will be left untouched; list them so the user knows they're safe)
- ⚠️ grey-zone files that differ and need manual merge (Step 5)

If nothing differs, report "already up to date" and stop.

**Gate: present the report and WAIT for the user's go before executing Steps 4–5b.** The
deletions in Step 4b rely on this confirmation — without it, nothing is copied or deleted.

## Step 4 · Copy the whitelist paths

Copy every ✅ row of the freshly cloned master's manifest from master → target, overwriting
but never deleting (PowerShell `Copy-Item -Force`, `-Recurse` for a folder). Create any missing
target folder first. A folder row copies the folder's contents into the target's folder, so the
target's own files there stay; a file row copies that one file:

```powershell
Copy-Item "$master\.claude\skills\*" "$target\.claude\skills\" -Recurse -Force          # folder row
Copy-Item "$master\project-memory\tasks\_README.md" "$target\project-memory\tasks\" -Force  # file row
```

## Step 4b · Delete obsolete template paths (manifest-listed ONLY)

Renames and merges in the master leave stale copies behind in the target — and a stale
skill keeps auto-triggering alongside its replacement. For each path in the master
manifest's 🗑️ Renames / deletions section that exists in the target:

1. Check its "Replaced by" cell. A cell naming a path → that path must exist in the target
   after Step 4 (a "merged into" entry counts if the merge target exists); if it is missing,
   skip the deletion and report it. A cell starting with "nothing" needs no check.
2. Delete it — the user already confirmed via the Step 3 pre-flight report.
3. A clean-up the cell names in a grey-zone file (`.gitignore`, `.claude/settings.json`,
   `CLAUDE.md`) joins Step 5; a per-machine command (`claude plugin …`, `/plugin install …`)
   goes to the Step 6 report for the user.

Anything NOT on that list is never deleted, no matter how obsolete it looks.

## Step 5 · Merge the grey zone (manual, user-confirmed)

For each ⚠️ file (per the manifest — typically root `CLAUDE.md`,
`project-memory/stack-architecture.md`, `project-memory/stack-architecture.next.md`,
`.claude/settings.json`, and root `.gitignore`):

1. Diff master vs. target.
2. Identify **template-side** changes only — e.g. a new `@import` line (per the rule-file
   special case below), a new Common Entry Points line, structural comments. Project-side content
   (Module Map rows, "What this system is", project stack customizations) is untouchable.
3. Present the proposed merge to the user and apply only after confirmation.

Special case: a rule file Step 4 copied that is new to the target. Read its frontmatter: a
rule with `paths:` is never `@import`ed (an import would load it at launch); every other new
rule gets its `@import` line in the target's `CLAUDE.md` index — flag this explicitly.

Special case: `.claude/settings.json` — merge it per the master manifest's
**`.claude/settings.json` merge** note. Until it is merged, the copied hook scripts stay
switched off; say so in the report if the user skips it.

## Step 5b · Post-sync alignment scan (the target's OWN docs)

Copying updates template files, but the target's project-state docs still reference
whatever was renamed or removed. Scan and align them — this step is NOT optional:

1. Build the search-term list from **every table in** the manifest's 🗑️ Renames / deletions
   section — it holds more than one, and a sub-heading table (e.g. a bulk prefix rename) counts.
   Take each obsolete skill name (e.g. `workspace-task-brief`) and removed concept (e.g. a module
   `specs/` folder).
2. Grep those terms across the target's LIVING docs only:
   root `CLAUDE.md`, `project-memory/overview/system-overview-spec.md`,
   `project-memory/modules/*/MODULE.md`, `project-memory/modules/*/<name>-flow.md`.
   **Leave historical archives untouched**: `plans/`, `impl/`, `references/` describe what
   was true at the time — stale names there are correct history, not defects.
3. For each hit, propose the fix (old → new, using the manifest mapping) and apply only
   after user confirmation — these files are project state; never mechanically rewrite them.
4. If a real module still has a `specs/` folder, don't touch it — remind the user of the
   routing rule (material → `references/`, `.sql` → `schema/`, work docs → `plans/`) and
   offer to migrate its content as a separate, per-file confirmed task.
5. Live plans in an old shape: list every plan whose status header is not `Done` and whose
   `## Tasks` table has no `Manager summary` column
   (`grep -l "^## Tasks" project-memory/modules/*/plans/[!_]*.md 2>/dev/null | xargs -r grep -L "Manager summary"`,
   then drop the `Done` ones). Offer to backfill them; on the user's go, add the column and write
   each row's summary from the plan itself (rules: `/wp-module-technical-design` Guardrails).
   `Done` plans are history — leave them alone.

## Step 6 · Report

Summarize in one short block: version pulled (`vX.Y.Z → vA.B.C`, or `none → vA.B.C` for a
pre-versioning project), files overwritten / added / deleted (manifest-listed) / merged /
skipped (project-own) / alignment fixes applied (Step 5b), and anything that needs the
user's follow-up. Remind the user to start a fresh session (or continue) so newly imported
rules take effect. That block is the handoff (the **Handoff** section of
`.claude/skills/_shared-conventions.md`): the summary is Done, the follow-ups are You now, the
fresh session is Next.

**Clean up:** if a temp master clone was created in Step 1, delete it now —
`Remove-Item $master -Recurse -Force`. (Nothing to clean up for the local-path fallback.)
