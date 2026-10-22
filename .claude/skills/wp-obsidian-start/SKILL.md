---
name: wp-obsidian-start
description: Route an Obsidian vault request to the right obsidian:* skill.
disable-model-invocation: true
---

# Obsidian Start — vault dispatcher

This skill is a **router, not a worker**: infer what the user wants in the vault, then hand off
to the skill that owns it.

## Step 1 · Preflight

- Any command that talks to a live vault (via `obsidian:obsidian-cli`) needs **Obsidian open**.
  If a CLI action is coming and it may not be running, say so in one line before proceeding.
- A route's `obsidian:*` skill missing from the available-skills list → the Obsidian skills plugin
  is not installed here: say so in one line and stop.

## Step 2 · Infer the intent (do not ask yet)

Read the user's request and try to map it to ONE capability below from their words alone.
Only if you genuinely cannot tell, go to Step 3.

| If the user wants to… | Route to skill |
|---|---|
| Read / create / search / append notes, manage tasks, properties, tags, backlinks, daily notes; reload/debug a plugin or theme | `obsidian:obsidian-cli` |
| Write or format the *content* of a note — wikilinks, embeds, callouts, frontmatter, tags, math, mermaid | `obsidian:obsidian-markdown` |
| Build a database-like view over notes — table/card view, filters, formulas (`.base` files) | `obsidian:obsidian-bases` |
| Make a visual canvas — mind map, flowchart, connected nodes (`.canvas` files) | `obsidian:json-canvas` |
| Save a web page / article cleanly into the vault (strip clutter) | `obsidian:defuddle` |
| Log / check a project's progress snapshot — modules, done work, next step — or see what's stalled across projects | `wp-obsidian-progress-log` |

Many real tasks combine two: e.g. "save this note about X" = compose content with
`obsidian:obsidian-markdown`, then write it with `obsidian:obsidian-cli`. Chain them in that order.

## Step 3 · If intent is unclear, offer the menu

Ask one question per the **Question pattern** in `.claude/skills/_shared-conventions.md`: the
route you infer as most likely first, up to 3 other rows of the table as alternatives (label +
one-line description). Then route per the table.

## Step 4 · Hand off

Invoke the chosen skill (Skill tool) and follow it to completion. Before it creates, overwrites
or modifies any note or vault file, state what will be written and where, and get a yes; reads
and searches go ahead unconfirmed. The chosen skill's closing handoff closes this run too.
