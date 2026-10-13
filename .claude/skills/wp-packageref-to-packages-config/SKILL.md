---
name: wp-packageref-to-packages-config
description: Convert a legacy (non-SDK, .NET Framework) .csproj/.vbproj from NuGet PackageReference to packages.config - writes packages.config with the resolved versions and transitive package deps, replaces PackageReference with Reference+HintPath, adds package build .props/.targets imports, clears stale obj NuGet files, then restores, builds and checks bin output for lost DLLs. Use when asked to convert / switch / revert a project from PackageReference to packages.config (PackageReference 轉 packages.config、改回 packages.config、轉換 NuGet 管理方式). Requires the project name; ask for it if not given.
argument-hint: <project name or path>
---

# PackageReference → packages.config

The naive recipe ("add an empty packages.config, delete the PackageReference items, reopen VS") leaves the code with no package references until every package is reinstalled by hand. This skill does the whole conversion from the resolved graph in `obj/project.assets.json`.

`scripts/convert.py` does the mechanical part (stdlib only, keeps BOM and CRLF):

```
python <skill>/scripts/convert.py <project>            # dry run
python <skill>/scripts/convert.py <project> --apply    # convert
python <skill>/scripts/convert.py <project> --check    # after nuget restore
```

`<project>` is a project name (searched under the cwd) or a path. Run from the solution folder.

## Step 0 - Name the project

The user must say which project to convert. No project name or path in the request → ask; never guess. Start the reply and the runbook with the project name.

If the script reports the name as ambiguous (same file name in several folders, e.g. backups), show the candidates and ask which one, then pass the full path. Convert one project per run. Several projects → repeat the steps for each one.

## Steps

1. **Pre-check.** `obj/project.assets.json` must be current. The script stops when it is stale and prints the restore command: `MSBuild <proj> /t:Restore`. Build once, then snapshot the output folder (`OutputPath`; web projects use `bin\`) to compare later: `ls <out> | sort > before.txt` (store it in the scratchpad).
2. **Dry run** and read the plan:
   - Only the project's own PackageReferences plus their *package* dependencies are converted. Packages that arrive through a ProjectReference stay with that project.
   - Versions are the resolved ones (e.g. NLog 4.6.6 even when NLog.Config asks for 4.5.11).
   - `(framework)` references come from the package `frameworkAssemblies`, the same ones a VS install adds.
   - Read every `WARNING` (content files such as `NLog.config`, runtime-only assemblies) and pass it on to the user.
3. **`--apply`** writes `packages.config`, removes `PackageReference`/`RestoreProjectStyle`, adds `<Reference>`+`HintPath`, adds `<None Include="packages.config" />`, adds the `.props`/`.targets` imports plus `EnsureNuGetPackageBuildImports`, and deletes `obj\project.assets.json` and `obj\<proj>.nuget.*`. Without that deletion MSBuild keeps importing the old nuget.g.props/targets. The script refuses if packages.config or EnsureNuGetPackageBuildImports already exists; merge those by hand.
4. **Restore:** `nuget restore <projdir>\packages.config -PackagesDirectory <sln dir>\packages -NonInteractive`. The VS2017 MSBuild cannot restore packages.config, and `MSBuild <sln> /restore` fails on solutions that contain `.vdproj`.
5. **`--check`** must exit 0. A missing HintPath is only warning MSB3245 at build time, so the build alone does not prove it.
6. **Build the whole solution.** Consumers of the project are affected too. Compare errors and warnings with the earlier build.
7. **Compare the output folder** with `before.txt`. packages.config does not flow packages to consumers the way PackageReference does, so DLLs that came in transitively can disappear. For each missing DLL, check whether it is needed at runtime: config-registered providers (`entityFramework`, `DbProviderFactories`, NLog targets in Web.config/App.config), `Assembly.Load`, or real use in the code (grep). If it is needed, add the package to this project's packages.config. Otherwise, report it as safely gone.
8. **Source control:** the new packages.config must be added (TFVC: `tf add <projdir>\packages.config /noprompt`; git: `git add`). Do not check in or commit unless asked.

## Gotchas

- Legacy projects only. An SDK-style project (`<Project Sdk=...>`) cannot use packages.config; the script stops when the C#/VB targets import is missing.
- Consumers that use PackageReference no longer receive this project's packages transitively. If such a consumer used them without its own reference, the build in step 6 fails. Add the package to that consumer.
- After a conversion VS may show packages as missing until the restore in step 4 has run, or VS restores them on the next build.
