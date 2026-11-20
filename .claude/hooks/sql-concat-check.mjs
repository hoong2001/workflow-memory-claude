// PreToolUse hook (Write | Edit | MultiEdit), wired in .claude/settings.json.
// SQL text in a Repositories/*.cs file is one literal template with {UPPER_SNAKE} tokens, filled by sql.Replace
// (skill wp-repository-unitofwork-pattern -> Dynamic Query Pattern). This hook denies a write that ADDS a line which
// assembles SQL text another way: a "+" next to a SQL literal, Append / AppendFormat of a SQL piece, or string.Format.
// A line already in the file (Write) or in the replaced text (Edit, MultiEdit) passes, so editing a legacy query
// never trips it. A line that extends a legacy "+" / Append query can carry the marker comment  // legacy-sql  and passes.
//
//   node sql-concat-check.mjs                  hook mode: reads PreToolUse JSON on stdin, denies on a violation
//   node sql-concat-check.mjs --scan ROOT      list every hit under ROOT (the legacy count; run once before wiring)
//   node sql-concat-check.mjs --selftest
//
// Fails OPEN on its own errors (bad JSON, unreadable file), so a broken hook never blocks work.
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const FILE_RE = /[\\/]Repositories[\\/][^\\/]+\.cs$/i;
const SKIP_DIRS = new Set(["bin", "obj", ".git", "node_modules", "packages"]);
const KW = "SELECT|FROM|JOIN|WHERE|AND|OR|ORDER BY|GROUP BY|HAVING|OFFSET|UNION|VALUES|SET";

// A SQL keyword inside a literal that closes right before a "+": "... FROM " + table
const CONCAT_AFTER = new RegExp(`\\b(?:${KW})\\b[^"\\r\\n]*"\\s*\\+`);
// A "+" followed by a literal that holds a SQL keyword: name + @" FROM ..."
const CONCAT_BEFORE = new RegExp(`\\+\\s*@?"[^"\\r\\n]*\\b(?:${KW})\\b`);
// string.Format, AppendFormat or Append of a literal that holds a SQL keyword
const FORMAT_OR_APPEND = new RegExp(`(?:string\\.Format|\\.AppendFormat|\\.Append)\\(\\s*\\$?@?"[^"\\r\\n]*\\b(?:${KW})\\b`);

const isHit = (line) => {
  if (/^\s*\/\//.test(line)) return false;
  if (/\/\/\s*legacy-sql\b/.test(line)) return false;
  return CONCAT_AFTER.test(line) || CONCAT_BEFORE.test(line) || FORMAT_OR_APPEND.test(line);
};

const lines = (text) => text.split(/\r?\n/);

// Hit lines of newText that are not already in oldText (compared as trimmed lines).
function addedHits(oldText, newText) {
  const before = new Set(lines(oldText).map((l) => l.trim()));
  return lines(newText).filter((l) => isHit(l) && !before.has(l.trim())).map((l) => l.trim());
}

function scan(root) {
  let total = 0;
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(p); }
      else if (FILE_RE.test(p)) {
        lines(fs.readFileSync(p, "utf8")).forEach((l, i) => { if (isHit(l)) { console.log(`${p}:${i + 1}: ${l.trim()}`); total++; } });
      }
    }
  };
  walk(root);
  console.log(`${total} hit(s)`);
}

function selftest() {
  const yes = [
    'sql.Append(@"WITH x AS (SELECT 1 FROM " + filter.ViewName + @" v',
    'AND c.Flag = \'" + ConstX.FLAG + @"\'',
    'return "ORDER BY " + filter.SortColumn + " " + direction;',
    'conditions.Append(" AND f.WmsBal = 0");',
    'return string.Format(" AND {0} IN({1})", column, list);',
    'var s = table + @" FROM Product";',
  ];
  const no = [
    'AND d.UserID = @UserID',
    'sql = sql.Replace("{ORDER_BY}", orderBy);',
    'return " AND g.SoldRanking BETWEEN 1 AND @MaxSoldRanking";',
    'WHERE a.Name LIKE \'%\' + @Search + \'%\'',
    '// sql.Append(" AND x") is only a comment',
    'sql.Append(" AND a.Flag = 1"); // legacy-sql extends an old query',
    'throw new ArgumentException("Invalid sort column.", "filter");',
    'string title = string.Format("{0} ({1}-{2})", a, b, c);',
  ];
  for (const l of yes) assert.ok(isHit(l), `should hit: ${l}`);
  for (const l of no) assert.ok(!isHit(l), `should pass: ${l}`);
  assert.deepEqual(addedHits('x = "FROM " + a;', 'x = "FROM " + a;\ny = "AND " + b;'), ['y = "AND " + b;']);
  assert.deepEqual(addedHits('x = "FROM " + a;', 'x = "FROM " + a;'), []);
  console.log("selftest ok");
}

function newTexts(input) {
  const ti = input.tool_input || {};
  const target = String(ti.file_path || "");
  if (!FILE_RE.test(target)) return null;
  if (typeof ti.content === "string") {
    let existing = "";
    try { existing = fs.readFileSync(target, "utf8"); } catch { /* a new file has no old text */ }
    return [{ oldText: existing, newText: ti.content }];
  }
  if (Array.isArray(ti.edits)) return ti.edits.map((e) => ({ oldText: String(e.old_string || ""), newText: String(e.new_string || "") }));
  if (typeof ti.new_string === "string") return [{ oldText: String(ti.old_string || ""), newText: ti.new_string }];
  return null;
}

function hook() {
  let raw = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (c) => { raw += c; });
  process.stdin.on("end", () => {
    let found = [];
    try {
      const pairs = newTexts(JSON.parse(raw));
      if (!pairs) process.exit(0);
      found = pairs.flatMap((p) => addedHits(p.oldText, p.newText));
    } catch {
      process.exit(0);
    }
    if (found.length === 0) process.exit(0);
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason:
          "SQL text is one literal template with {UPPER_SNAKE} tokens, filled by sql.Replace (skill wp-repository-unitofwork-pattern, " +
          "Dynamic Query Pattern); a helper returns the text for a token. These added lines assemble SQL another way: " +
          found.slice(0, 3).join(" | "),
      },
    }));
  });
}

const [mode, arg] = process.argv.slice(2);
if (mode === "--scan") scan(arg || ".");
else if (mode === "--selftest") selftest();
else hook();
