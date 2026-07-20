# Conformance Scan (run ONCE when adopting this framework on an existing system)

> Referenced from `.claude/workspace-project-stack-architecture.md` §0 Adoption Mode.
> Read on demand at adoption time — never needed again after **Current mode** is set.

Check each hard rule in the architecture doc against repo evidence:

- `.csproj` — `TargetFrameworkVersion` / `LangVersion`
- `packages.config` — library versions vs the §1 stack table
- `.sln` project layout vs the §2/§3 layering
- Base class inheritance (§2.3)
- Grep for forbidden patterns (§4.1 — e.g. async / DI / EF)
- Frontend library versions vs §1.2

**Outcome:**
- All pass → declare `brownfield-conformant` in §0 and keep the architecture doc as-is.
- Any deviation → report the list and let the user rule: amend the architecture doc, or
  record it as debt in the affected module's `MODULE.md` (Local conventions / Known gotchas).
  Never silently edit either side.
