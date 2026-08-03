---
name: wp-obsidian-start
description: Entry point for working with the user's Obsidian vault. Infers what the user wants to do with Obsidian and routes to the right underlying Obsidian skill (CLI, Markdown, Bases, Canvas, web capture) instead of reinventing them. Use when the user's request names Obsidian but the specific action is not yet pinned down — "open obsidian", "用 obsidian", "obsidian 幫我...", "put this in my vault", "start a note", or any vault task where the tool/format to use is unclear. Do NOT use when the action is already unambiguous — go straight to the specific skill (e.g. reading a note → obsidian:obsidian-cli; writing note syntax → obsidian:obsidian-markdown).
---

# Obsidian Start — vault dispatcher

This skill is a **router, not a worker**. It never re-teaches CLI commands or Markdown
syntax. Its whole job is: figure out what the user wants to do with their Obsidian vault,
then hand off to the right underlying Obsidian skill. Those skills own the actual how-to and
stay maintained upstream — this dispatcher just points at them.

The vault path lives in the user's global config, not here — keep this skill generic (no
hardcoded vault path, no personal folder names), so it stays portable across projects.

## Step 1 · Preflight

- **This dispatcher resolves no vault path itself** — it only routes. Every write path is owned
  by the skill it hands off to: `wp-obsidian-progress-log` reads its own config;
  `obsidian:obsidian-cli` targets the focused vault; `obsidian:obsidian-markdown` composes and
  writes through the CLI. So there is nothing to configure here and NO dependency on any sibling
  skill — the two Obsidian skills stay fully independent and can be split apart without breaking.
- Any command that talks to a live vault (via `obsidian:obsidian-cli`) needs **Obsidian open**.
  If a CLI action is coming and it may not be running, say so in one line before proceeding.

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

Ask the user with AskUserQuestion, presenting the capabilities above as options (label +
one-line description), so they pick what to do with Obsidian this time. Then route per the table.

## Step 4 · Hand off

Invoke the chosen skill (via the Skill tool) and follow its guidance to completion. This
dispatcher adds nothing on top except the routing decision.

## Step 5 · Never write silently

Per the user's standing rule, Obsidian is theirs. Before creating, overwriting, or modifying
ANY note or vault file, state exactly what will be written and where, and get a yes first.
Reading and searching need no confirmation.
