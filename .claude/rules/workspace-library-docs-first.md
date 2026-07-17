# Library Docs First — Never Guess an API

Before writing code that calls a third-party library or UI control (backend package or
frontend plugin), never guess signatures, option names, events, or CSS classes. In order:

1. **Match existing usage first** — grep the codebase for how this library is already
   called and follow that pattern (consistency beats novelty; it also encodes past fixes).
2. **No existing usage, or any uncertainty** → read the docs BEFORE coding.
   First CONFIRM the context7 MCP is actually connected (its `mcp__context7__*` tools
   appear in the tool list / ToolSearch finds them) — other users/machines may not have
   it installed. Connected → invoke it through the `context7-mcp` skill, which carries
   the correct call sequence. Not connected → fall back to official docs via web without
   stalling or erroring. If neither is available, say exactly what is unverified instead
   of inventing it.
3. **Version-pin the lookup** — docs must match the version pinned in
   `.claude/workspace-project-stack-architecture.md` §1. Latest-version docs routinely
   describe APIs that don't exist in the pinned version; when the docs are newer,
   confirm the feature exists in the pinned release before using it.
4. Highest-risk spots (always verify, never recall from memory): config option names,
   event names, method signatures, initialization defaults, CSS class names.

**Why:** an invented API is the top source of "compiles and runs but behaves wrong"
bugs, and version drift makes memory unreliable even for well-known libraries.
