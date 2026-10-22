# Conformance Scan (run ONCE when adopting this framework on an existing system)

> Referenced from `project-memory/stack-architecture.md` §0 Adoption Mode.
> Read on demand at adoption time — never needed again after **Current mode** is set.

Check each hard rule in the architecture doc against repo evidence:

- `.csproj` — `TargetFrameworkVersion` / `LangVersion`
- `packages.config` — library versions vs the §1 stack table
- `.sln` project layout vs the §2/§3 layering
- Base class inheritance (§2.3)
- Grep for forbidden patterns (§4.1 — e.g. async / DI / EF)
- Frontend library versions vs §1.2

**Outcome:**
- All pass → set **Current mode** to `brownfield-conformant` and keep the architecture doc as-is.
- Any deviation → report the list and set **Current mode** to `brownfield`. A deviation the user
  rules a mistake in the doc itself (e.g. a wrong version) → amend the doc on their go. Record
  nothing in module folders now: per §0, a module's deviations go into its `MODULE.md` when work
  first touches that module.
