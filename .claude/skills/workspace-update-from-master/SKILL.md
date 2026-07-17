---
name: workspace-update-from-master
description: Sync workflow-template updates from the master workflow-memory-claude repo into the current project, strictly following the master's SYNC-MANIFEST.md whitelist. Prompts the user to confirm the master path before touching anything. Use when the user says "sync from master", "update the template", "pull template updates" (in any language), or wants to pull the latest rules/skills/module-template into a project that already adopted this workflow. Do NOT use for syncing project → master (improvements flow back by hand), and NEVER as an excuse to bulk-copy the whole .claude/ tree.
---

# Update From Master — Template Sync (project side)

Pull template updates from the master `workflow-memory-claude` repo into the current
project. The master's `SYNC-MANIFEST.md` is the single source of truth for what may
be copied; this skill is the executor, not the policy.

**Hard safety rules (non-negotiable):**
- NEVER copy the whole `.claude/` tree or repo root wholesale.
- NEVER delete files in the target that don't exist in the master (no mirror/`robocopy /MIR` semantics) — projects may have added their own rules/skills. ONLY exception: paths explicitly listed in the master manifest's 🗑️ Renames / deletions section, removed after user confirmation (Step 4b) — otherwise renamed/merged skills linger and keep auto-triggering alongside their replacements.
- NEVER touch real module folders under `.claude/modules/` (anything other than `example-module`) or `.claude/overview/`.
- Grey-zone files are merged with user confirmation, never mechanically overwritten.

## Step 1 · Confirm the master path (always ask)

The master path is machine-specific, so it is never hardcoded here. Ask the user:

> "What is the root path of the master template repo?" — offer the last-used path
> if one is known from memory/conversation as the default option, plus an
> "other / type it" fallback.

Then validate before proceeding — ALL must pass, otherwise stop and re-ask:
1. The path exists and contains `SYNC-MANIFEST.md` at its root.
2. It contains `.claude/rules/` and `.claude/skills/`.
3. It is NOT the same directory as the current project (syncing master onto itself is a no-op; warn and stop).

## Step 2 · Read the manifest (SSOT)

Read `SYNC-MANIFEST.md` **from the master** (not the local copy — the master's version
is newer by definition). Its ✅ / 🚫 / ⚠️ categories drive everything below. If the
manifest lists paths this skill doesn't mention, follow the manifest.

## Step 3 · Pre-flight report

Before copying anything, show the user a dry-run summary:
- ✅ paths that will be overwritten (list files that actually differ, not everything — compare content or timestamps)
- 🆕 files that exist only in master (will be added)
- 🗑️ target paths that appear on the manifest's Renames / deletions list (will be deleted in Step 4b — show the old → new mapping so the user sees what replaces each)
- 🏠 files that exist only in the target's `rules/`/`skills/` AND are not on the deletions list (project-own additions — will be left untouched; list them so the user knows they're safe)
- ⚠️ grey-zone files that differ and need manual merge (Step 5)

If nothing differs, report "already up to date" and stop.

## Step 4 · Copy the whitelist paths

Copy each ✅ path from master → target with overwrite-but-never-delete semantics
(PowerShell `Copy-Item -Force`, with `-Recurse` for folders). Typical set per the manifest:

```powershell
Copy-Item "$master\.claude\rules\*"  "$target\.claude\rules\"  -Force
Copy-Item "$master\.claude\skills\*" "$target\.claude\skills\" -Recurse -Force
Copy-Item "$master\.claude\modules\example-module" "$target\.claude\modules\" -Recurse -Force
Copy-Item "$master\SYNC-MANIFEST.md" "$target\" -Force
```

If a target folder doesn't exist yet (first-time bootstrap of an old project), create it first.

## Step 4b · Delete obsolete template paths (manifest-listed ONLY)

Renames and merges in the master leave stale copies behind in the target — and a stale
skill keeps auto-triggering alongside its replacement. For each path in the master
manifest's 🗑️ Renames / deletions section that exists in the target:

1. Verify its replacement was just copied in Step 4 (never delete before the replacement
   is in place; a "merged into" entry counts if the merge target exists).
2. Delete it — the user already confirmed via the Step 3 pre-flight report.

Anything NOT on that list is never deleted, no matter how obsolete it looks. Real module
folders are always out of scope (🚫) even if they contain a `specs/` folder — that content
is migrated by hand per the workflow routing rule (material → `references/`, `.sql` →
`schema/`, work docs → `plans/`), never deleted by sync.

## Step 5 · Merge the grey zone (manual, user-confirmed)

For each ⚠️ file (per the manifest — typically root `CLAUDE.md` and
`.claude/workspace-project-stack-architecture.md`):

1. Diff master vs. target.
2. Identify **template-side** changes only — e.g. a new `@import` line for a newly added
   rule, a new Common Entry Points line, structural comments. Project-side content
   (Module Map rows, "What this system is", project stack customizations) is untouchable.
3. Present the proposed merge to the user and apply only after confirmation.

Special case: if Step 4 copied a rule file that is new to the target, its `@import`
line MUST be added to the target's `CLAUDE.md` — flag this explicitly.

## Step 6 · Report

Summarize in one short block: files overwritten / added / deleted (manifest-listed) / merged / skipped (project-own),
and anything that needs the user's follow-up. Remind the user to start a fresh session
(or continue) so newly imported rules take effect.
