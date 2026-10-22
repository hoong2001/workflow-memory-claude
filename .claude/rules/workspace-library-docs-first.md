# Library Docs First — Verify Every API

Before writing code that calls a third-party library or UI control (backend package or
frontend plugin), verify its signatures, option names, events, and CSS classes, in this order:

1. **Match existing usage** — grep the codebase for how the library is already called and
   follow that pattern (it also encodes past fixes).
2. **No existing usage, or any doubt** → read the docs before coding: context7
   (`mcp__context7__*`) when connected, else the official docs on the web. Neither reachable →
   say exactly what is unverified.
3. **Version-pin the lookup** — docs must match the version pinned in
   `project-memory/stack-architecture.md` §1; when they are newer, confirm the feature exists in
   the pinned release.
4. Highest-risk spots, always verified: config option names, event names, method signatures,
   initialization defaults, CSS class names.

**Why:** an invented API is the top source of "compiles and runs but behaves wrong"
bugs, and version drift makes memory unreliable even for well-known libraries.
