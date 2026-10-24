#!/usr/bin/env node
/**
 * 2026.10.24 SessionStart: point the user at /wp-interview on every fresh session.
 *
 * Prints one line for the user (systemMessage) and nothing for Claude: the skill's own
 * description already routes an idea or a problem there, and added context would make Claude
 * push the interview on sessions that only resume work.
 *
 * Runtime: Node.js 18+. Wired in .claude/settings.json → hooks.SessionStart, matcher "startup".
 */

const msg = 'Not sure where to start? /wp-interview';
process.stdout.write(JSON.stringify({ systemMessage: msg }));
