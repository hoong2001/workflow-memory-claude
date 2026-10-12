---
name: wp-tfvc
description: Operate TFVC (Team Foundation Version Control, Azure DevOps / TFS) from the command line with tf.exe the way git is used in a git repo - status, diff, get latest, add/delete, check in, undo, shelve/unshelve, history, merge between branches, resolve conflicts. Use whenever the working folder is a TFVC workspace (no .git folder; `tf workfold .` names a mapping) or the user says check in, get latest, shelve, changeset, merge branch, "簽入", "取得最新版", "擱置", "合併分支", or names `tf`. Do NOT use in a git repository - use git there.
---

# TFVC with `tf` — the git habits, translated

`tf` is TFVC's command line (it ships with Visual Studio Team Explorer). Use it for every
version-control step in a TFVC workspace, as git would be used in a git repo. Verified against
`tf vc help <command>` of tf 15.x (Visual Studio 2017); newer `tf` accepts the same commands.

## Is this a TFVC workspace?

```
tf workfold .
```

Prints the workspace name and its server ↔ local mappings → TFVC. Prints `Unable to determine the
source control server.` → not a TFVC workspace; stop using this skill. `tf` not found → tell the user to put
Team Explorer's folder on `PATH` (`...\Common7\IDE\CommonExtensions\Microsoft\TeamFoundation\Team Explorer`).

## Four rules that prevent real damage

1. **Every command that accepts `/noprompt` gets it** — `checkin`, `get`, `undo`, `shelve`,
   `unshelve`, `merge`, `resolve`, `add`, and the read-only `history`, `diff`, `changeset` too.
   Without it `tf` may open a GUI dialog and the shell hangs until timeout. `status` and
   `workfold` print to the shell.
2. **Check in by explicit path, never the workspace root.** The root also holds files that must
   not go in (`project-memory/`, local notes, build output). Show the user the file list and the
   comment, and check in only after their go — same as a git commit the user has not approved.
3. **New and deleted files are only "detected" until pended.** In a local workspace, an edited
   file is pending automatically; a new file needs `tf add`, a removed file needs `tf delete`
   (or `tf reconcile /promote`), or the check-in silently leaves it out.
4. **Never resolve a content conflict by picking a side blindly.** `tf resolve /auto:` takes a
   whole file from one side. Use `AutoMerge` first; whatever it cannot merge goes to the user
   (Visual Studio's merge tool) with the file list — never `TakeTheirs` / `KeepYours` on their behalf.

## git → tf

| git | tf | Note |
|---|---|---|
| `git status` | `tf status . /recursive /format:brief` | Ends with `N change(s), M detected change(s)` — two separate lists |
| `git diff <file>` | `tf diff <file> /format:unified /noprompt` | `/format:unified` keeps it in the shell instead of the diff GUI |
| `git pull` | `tf get . /recursive /noprompt` | Conflicts are listed at the end of the output |
| `git add <new>` | `tf add <path> /recursive /noprompt` | Only for new files; edits are pending already |
| `git rm <file>` | `tf delete <path>` | Already deleted on disk → `tf reconcile /promote /deletes /noprompt <path>` |
| (all detected at once) | `tf reconcile /promote /adds /deletes /preview <path>` | Drop `/preview` only after the user approves the list |
| `git commit` + `git push` | `tf checkin <path1> <path2> /comment:"..." /noprompt` | One step: a check-in lands on the server as a changeset |
| `git checkout -- <file>` | `tf undo <path> /noprompt` | Discards the local edit — confirm first, it cannot be undone |
| `git stash` | `tf shelve "<name>" <path> /comment:"..." /noprompt` | Add `/move` to also undo the local changes; a shelveset is server-side and shareable |
| `git stash pop` | `tf unshelve "<name>" /noprompt` | |
| `git log <path>` | `tf history <path> /recursive /stopafter:20 /format:brief /noprompt` | |
| `git show <sha>` | `tf changeset <number> /noprompt` | |
| `git merge` | `tf merge <source> <target> /recursive /noprompt` | Then `tf resolve /auto:AutoMerge /noprompt` and `tf status`; check in the merge as its own changeset |
| conflict status | `tf resolve /preview /recursive <path>` | Lists what is still in conflict without changing anything |

`<path>` is a local path or a server path (`$/Project/Main/...`). A changeset in `/version:` is
written `C1234`; latest is `T`.

## Typical flows

**Check in what I changed.** `tf status . /recursive /format:brief` → pend anything detected that
belongs in (`tf add` / `tf delete`) → show the user the path list and a proposed comment → on their
go, `tf checkin <paths> /comment:"..." /noprompt` → report the changeset number from the output.

**Start of work.** `tf get . /recursive /noprompt`. If it reports conflicts, `tf resolve /auto:AutoMerge
/noprompt`, then hand anything left to the user.

**Merge a branch.** Confirm source and target server paths with the user → `tf merge <source> <target>
/recursive /noprompt` → `tf resolve /auto:AutoMerge /noprompt` → `tf status` → show the list → check
in on their go with a comment naming the source branch.
