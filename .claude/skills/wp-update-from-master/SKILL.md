---
name: wp-update-from-master
description: Sync template updates from the master repo per its SYNC-MANIFEST.md.
disable-model-invocation: true
---

# Update From Master — Template Sync (project side)

Pull template updates from the master `workflow-memory-claude` repo into the current
project. The master's `SYNC-MANIFEST.md` is the single source of truth for what may
be copied.

**Scope of every write:** ✅ rows are copied (Step 4), 🗑️ rows deleted after the user's go
(Step 4b), ⚠️ files merged by hand after the user's go (Step 5); every other target path — 🚫
rows, the project's own rules, skills, hooks and scripts — stays exactly as it is. Inside 🚫
folders only the ✅ `_README.md` files are written. Nothing is mirrored: a target file the master
lacks is deleted only when the 🗑️ list names it, because a renamed skill left behind keeps
auto-triggering beside its replacement. A path that fits no manifest category → treat it as 🚫
and ask the user.

## Step 1 · Get the master (git clone by default)

1. **Read the source** from the target project's **local** `SYNC-MANIFEST.md` → "📦 Master
   source" block: `<repo>` = its `Repo` row, `<branch>` = its `Branch` row. Offer them as the
   default; let the user override the URL/branch if they say so.
2. **Shallow-clone** it into a fresh temp directory, in ONE command. `GIT_DIR` / `GIT_WORK_TREE`
   leaking in from the parent shell make a clone download objects without populating the working
   tree, so clear both, force a checkout, and assert the tree is non-empty before any diff — an
   empty tree is a hard stop:

   ```powershell
   Remove-Item Env:GIT_DIR, Env:GIT_WORK_TREE -ErrorAction SilentlyContinue
   $master = Join-Path $env:TEMP ("wmc-master-" + [guid]::NewGuid().ToString('N'))
   git clone --depth 1 --branch <branch> <repo> "$master"
   git -C "$master" checkout -f HEAD
   if (-not (Get-ChildItem -Force "$master" | Where-Object Name -ne '.git')) {
       throw "Clone left an empty working tree — stop, do not diff."
   }
   $master
   ```

   Keep the printed path: shell variables do not survive between tool calls, so every later
   command spells out `<master path>` and `<target root>` literally, quoted — both may contain
   spaces, and an unquoted path resolves to the wrong depth.

   If the clone fails (no network, bad URL), report the exact error and offer the local
   fallback below — never proceed with a half-cloned tree.
3. **Local fallback** (offline, or testing an unpushed master): if the user asks to sync
   from a local master folder instead, skip the clone and ask for that path.

Then validate the master (clone OR local path) before proceeding — ALL must pass, else stop:
1. It contains `SYNC-MANIFEST.md` at its root.
2. It contains `.claude/rules/` and `.claude/skills/`.
3. The current project is **not the master itself** — if the project's
   `git remote get-url origin` equals the master URL, this repo IS the master; syncing onto
   itself is a no-op. Warn and stop. No git repo or no `origin` (a TFVC project) → not the
   master; carry on.

**Every exit after a clone deletes it** — a stop in this validation or Step 3 as much
as the end of Step 6: `Remove-Item "<master path>" -Recurse -Force`. A local-path master is never
deleted.

## Step 2 · Read the manifest (SSOT)

Read `SYNC-MANIFEST.md` **from the freshly cloned master** (not the target's local copy —
the clone is the newest by definition). Its ✅ / 🚫 / ⚠️ categories drive everything below.
If the manifest lists paths this skill doesn't mention, follow the manifest.

## Step 3 · Pre-flight report

Run the script from the **clone** — the target's own copy may be older or missing, and an
out-of-date copy runs out-of-date logic. A local-path master runs its own copy the same way:

```powershell
node "<master path>\.claude\scripts\sync-from-master.mjs" report "<target root>"
```

It writes nothing. Its first line is the version pair (`target vX.Y.Z → master vA.B.C`, or
`target none`, for a project synced before versioning existed).

- **Equal** → report `Target already at vX.Y.Z — no template changes to pull.` and stop. The
  version tracks commits, not content: when the user wants to be sure, the rest of the report
  is the ground truth.
- **Different, or none** → carry both numbers into the Step 6 summary and show the user the rest
  of the report: ✅ overwrite (content differs), 🆕 add (master only), 🗑️ target paths on the
  manifest's Renames / deletions list with what replaces each (deleted in Step 4b), 🧩 project-own
  files under a ✅ folder (left untouched), ⚠️ grey-zone files that differ (Step 5). Files that
  differ only in line endings or BOM are counted and ignored — they are never copied. Nothing
  differs → report "already up to date" and stop.

**Gate: present the report and WAIT for the user's go before executing Steps 4–5b.** The
deletions in Step 4b rely on this confirmation — without it, nothing is copied or deleted.

## Step 4 · Copy the whitelist paths

```powershell
node "<master path>\.claude\scripts\sync-from-master.mjs" copy "<target root>"
```

It copies exactly the ✅ overwrite and 🆕 add files of the report, creating missing folders,
and leaves line-ending-only differences and the target's own files as they are. It never deletes.

## Step 4b · Delete obsolete template paths (manifest-listed ONLY)

Run the deletions as their own commands, apart from Step 4's copies — the permission layer
misresolves multi-action path commands. For each path in the master manifest's 🗑️ Renames /
deletions section that exists in the target:

1. Check its "Replaced by" cell. A cell naming a path → that path must exist in the target
   after Step 4 (a "merged into" entry counts if the merge target exists); if it is missing,
   skip the deletion and report it. A cell starting with "nothing" needs no check.
2. Delete it — the user already confirmed via the Step 3 pre-flight report.
3. A clean-up the cell names in a grey-zone file (`.gitignore`, `.claude/settings.json`,
   `CLAUDE.md`) joins Step 5; a per-machine command (`claude plugin …`, `/plugin install …`)
   goes to the Step 6 report for the user.

Anything NOT on that list is never deleted, no matter how obsolete it looks.

## Step 5 · Merge the grey zone (manual, user-confirmed)

For each ⚠️ row of the master manifest:

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

1. Run the scan from the clone:

   ```powershell
   node "<master path>\.claude\scripts\sync-from-master.mjs" scan "<target root>"
   ```

   It takes every obsolete name from all tables of the manifest's 🗑️ section and greps the
   target's LIVING docs: root `CLAUDE.md`, `project-memory/overview/system-overview-spec.md`, and
   each real module's `MODULE.md` and `<name>-flow.md`. Historical archives — `plans/`, `impl/`,
   `references/` — are left out: stale names there are correct history.
2. Each hit is a lead, not a defect: a line can name the concept on purpose ("no separate
   `specs/` folder"). For a stale name, propose the fix (old → new, from the manifest mapping)
   and apply it only after user confirmation — these files are project state.
3. If a real module still has a `specs/` folder, don't touch it — remind the user of the
   routing rule (material → `references/`, `.sql` → `schema/`, work docs → `plans/`) and
   offer to migrate its content as a separate, per-file confirmed task.
4. Live plans in an old shape: the scan's second list holds every plan not `Done` whose
   `## Tasks` table has no `Manager summary` column. Offer to backfill them; on the user's go,
   add the column and write each row's summary from the plan itself (rules:
   `/wp-module-technical-design` Guardrails). `Done` plans are history — leave them alone.

## Step 6 · Report

Summarize in one short block: version pulled (`vX.Y.Z → vA.B.C`, or `none → vA.B.C` for a
pre-versioning project), files overwritten / added / deleted (manifest-listed) / merged /
skipped (project-own) / alignment fixes applied (Step 5b), and anything that needs the
user's follow-up. Remind the user to start a fresh session (or continue) so newly imported
rules take effect. That block is the handoff (the **Handoff** section of
`.claude/skills/_shared-conventions.md`): the summary is Done, the follow-ups are You now, the
fresh session is Next.

**Clean up** the temp clone per Step 1.
