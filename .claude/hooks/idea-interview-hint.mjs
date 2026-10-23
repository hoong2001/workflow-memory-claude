#!/usr/bin/env node
/**
 * 2026.10.23 SessionStart: point the user at /wp-idea-interview on every fresh session.
 *
 * Prints one line for the user (systemMessage) and nothing for Claude: the skill's own
 * description already routes an idea there, and added context would make Claude push the
 * interview on sessions that only resume work.
 *
 * Runtime: Node.js 18+. Wired in .claude/settings.json → hooks.SessionStart, matcher "startup".
 */

const msg = 'Got an idea but no clear requirement yet? Type /wp-idea-interview — clickable questions turn it into a goal and the next command.';
process.stdout.write(JSON.stringify({ systemMessage: msg }));
