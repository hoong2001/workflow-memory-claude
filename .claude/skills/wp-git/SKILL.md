---
name: wp-git
description: Operate git with confirmation gates — init, status, diff, add, commit, push, pull, branch, switch, stash, undo, reset, rebase, merge. Use when the user asks for a git operation or how to do one, starts a project with no version control, wants a branch but is unsure how, or a task reached a checkpoint (build green and tested, plan Done, new plan starting on main or a dirty tree). Destructive operations always ask first. TFVC workspace → `wp-tfvc`.
---

# git — the decisions stay with the user

Claude proposes the git step the moment the work calls for it and runs it on the user's go. A
question ("how do I …?") is answered, then offered as a choice Claude can run.

## What kind of folder is this?

`git rev-parse --is-inside-work-tree`:

- `true` → a git repo; continue.
- An error, and `tf workfold .` prints a mapping → TFVC; use `wp-tfvc`.
- An error, no mapping → no version control. Offer `git init` through `AskUserQuestion`: "Init here"
  (recommended) · "Not now". On a yes, follow **New project** below.

## Orient before every request

Say one line first, from `git status -sb`: branch, upstream, ahead/behind, changed-file count.
Detached HEAD, or behind upstream → say so in that line.

## Risk tiers

| Tier | Meaning | Claude |
|---|---|---|
| 0 | reads only | runs it |
| 1 | local and reversible | runs it when the request asks for it |
| 2 | outward, or hard to take back | shows the file list, the message and the remote, then `AskUserQuestion` |
| 3 | destructive | `AskUserQuestion` every time — consent is never inferred |

A tier 3 question names what is lost (`N uncommitted files`, `M unpushed commits`), recommends the
safe alternative first (`stash`, `revert`, a `backup/<slug>` branch), and after the run gives
`git reflog` as the way back. Hooks and signing stay on: no `--no-verify`.

## Command index

| Command | Tier | Note |
|---|---|---|
| `init` | 1 | creates `.git` — **New project** |
| `status` | 0 | |
| `add <path>` | 1 | explicit paths — rule 1 |
| `commit` | 2 | |
| `log`, `diff`, `show` | 0 | `log --oneline -10` for a quick scan; `diff` unstaged, `diff --staged` staged, `diff HEAD` both |
| `branch` | 0 list (`-vv`) · 1 create, `-d` · 3 `-D` | |
| `checkout`, `switch` | 1 switch branch · 3 `checkout -- <file>` | prefer `switch` / `restore`; accept `checkout` when the user types it |
| `merge` | 1 with `--ff-only` · 2 into `main`, or not fast-forward | |
| `push` | 2 | first push of a branch: `push -u origin <branch>` |
| `fetch` | 0 | |
| `pull` | 1 | run as `fetch` + `merge --ff-only` (rule 5) |
| `stash`, `stash pop` | 1 | `stash push -u` |
| `rebase` | 2 unpushed commits · 3 pushed commits | interactive `rebase -i` is unavailable here |
| `cherry-pick` | 1 | conflicts → rule 3 |
| `reset` | 1 `--soft` / `--mixed` · 3 `--hard` | |
| `revert` | 1 | the push that follows is tier 2 |
| `bisect` | 1 | only when asked; end with `bisect reset` |
| `restore`, `clean -fd`, `stash drop`, `push --force`, `commit --amend` of a pushed commit | 3 | |

## Rules that prevent real damage

1. **Add by explicit path, never `git add -A` or `.`** — local notes, `*.local.json` and build
   output are not for the repo. Show the list.
2. **Undo ladder.** Pushed → `revert`. Unpushed → `reset --soft` (keeps the work staged) or
   `--mixed`. `--hard` is tier 3.
3. **Conflicts go to the user.** Auto-merge what merges; never pick `-X ours/theirs` or
   `checkout --ours/--theirs` for them.
4. **Messages.** Write the message to a scratch file and `git commit -F <file>`. Match
   `git log --oneline -10`. End with the attribution lines the session names.
5. **Sync is `fetch` first.** Show `git log HEAD..@{u} --oneline`, then `git merge --ff-only @{u}`;
   not fast-forward → ask.

## New project (`init`)

1. `git rev-parse --show-toplevel` prints a path → already inside a repo; say where and stop.
2. Confirm the folder is the project root the user means, not a drive root or the home folder. A
   cloud-sync folder (Google Drive, OneDrive) → say so: the sync client and `.git` can conflict.
3. `.gitignore` comes before the first add: `bin/`, `obj/`, `packages/`, `.vs/`, `*.user`,
   `*.local.json`. A `Web.config` or `App.config` holding a live password stays out of the repo.
4. `git init -b main`.
5. First commit: tier 2, with the file list.
6. Remote: `git remote add origin <url>` and `git push -u origin main` — tier 2 and outward; ask
   public or private first.

## I want to …

| Intent | Command | Trap |
|---|---|---|
| Set work aside | `git stash push -u -m "<name>"` · back: `git stash pop` | without `-u`, new files stay behind |
| Undo the last unpushed commit, keep the work | `git reset --soft HEAD~1` | |
| Squash local commits | `git reset --soft <base>` + recommit | `rebase -i` is unavailable here |
| Discard one file's edits | `git restore <file>` | tier 3: the edits cannot come back |
| Undo a pushed commit | `git revert <sha>` | new commit; history stays |
| Take one commit from another branch | `git cherry-pick <sha>` | |
| Find the commit that broke it | `git bisect` | only when asked |

## Branch helper

The user wants a branch but is unsure how → `AskUserQuestion` on what they are trying to do, each
option's preview holding the exact commands:

- **Big or risky change, main untouched** — `git switch -c feature/<slug>`
- **Park this work, start something else** — `git stash push -u -m "<name>"`, then
  `git switch -c fix/<slug> main`
- **Go back to an earlier point and retry** — `git switch -c retry/<slug> <sha>`; the current branch stays

`<slug>` = the plan's slug when one exists. `switch -c` carries uncommitted changes along — say so
when the tree is dirty.

## When to speak up

Propose, never run unasked — as the handoff's 👉 You now, a choice through `AskUserQuestion`:

| Moment | Proposal |
|---|---|
| A folder with no version control | `git init` |
| A task's build is green and the user tested it | commit — with the file list and a message draft |
| `/wp-module-save-implementation` finished | commit (push when the user says so) |
| A new plan or wide refactor starts on `main` or a dirty tree | a branch |
| An urgent fix is needed with uncommitted edits | `stash` |
| Several tasks' edits sit in one tree | one commit per task |

## Report

After a commit: hash, branch, file count. After a push: `git rev-parse HEAD origin/<branch>` agree
and `git ls-remote origin refs/heads/<branch>` shows the same hash; state a mismatch flatly.
`LF will be replaced by CRLF` lines are notices, not errors.
