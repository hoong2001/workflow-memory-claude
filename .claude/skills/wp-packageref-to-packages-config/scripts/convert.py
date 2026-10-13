#!/usr/bin/env python3
"""Convert a legacy (non-SDK) .csproj/.vbproj from PackageReference to packages.config.

Reads obj/project.assets.json (the resolved NuGet graph) so versions, transitive
package dependencies, compile DLLs and build .props/.targets match what the
PackageReference build actually used.

  <project> = project name (searched under the cwd) or path to the .csproj/.vbproj

  convert.py <project>                 dry run: print the plan, change nothing
  convert.py <project> --apply         write packages.config, edit project, clear obj NuGet files
  convert.py <project> --check         after `nuget restore`: every HintPath / package Import exists?
  options: --packages-dir DIR          default: <dir of nearest *.sln above the project>/packages

Stdlib only. Keeps the project file's BOM and line endings.
"""
import argparse
import json
import os
import re
import sys
from pathlib import Path

LANG_TARGETS = re.compile(r'^[ \t]*<Import Project="[^"]*Microsoft\.(CSharp|VisualBasic)\.targets"[^>]*/>[ \t]*\n', re.M)
COMMON_PROPS = re.compile(r'^[ \t]*<Import Project="[^"]*Microsoft\.Common\.props"[^>]*/>[ \t]*\n', re.M)
ANY_IMPORT = re.compile(r'^[ \t]*<Import Project="[^"]*"[^>]*/>[ \t]*\n', re.M)
PKGREF = re.compile(r'^[ \t]*<PackageReference\b[^>]*?(/>|>.*?</PackageReference>)[ \t]*\n', re.M | re.S | re.I)
EMPTY_ITEMGROUP = re.compile(r'^[ \t]*<ItemGroup>\s*</ItemGroup>[ \t]*\n', re.M)
RESTORE_STYLE = re.compile(r'^[ \t]*<RestoreProjectStyle>.*?</RestoreProjectStyle>[ \t]*\n', re.M | re.S)
I = '  '  # legacy project indentation unit


def read_text(p):
    raw = p.read_bytes()
    bom = raw.startswith(b'\xef\xbb\xbf')
    text = raw[3 if bom else 0:].decode('utf-8')
    nl = '\r\n' if '\r\n' in text else '\n'
    return text.replace('\r\n', '\n'), bom, nl


def write_text(p, text, bom, nl):
    p.write_bytes((b'\xef\xbb\xbf' if bom else b'') + text.replace('\n', nl).encode('utf-8'))


def default_packages_dir(proj):
    for d in [proj.parent, *proj.parent.parents]:
        if any(d.glob('*.sln')):
            return d / 'packages'
    sys.exit('No .sln found above the project; pass --packages-dir.')


def winrel(target, start):
    return os.path.relpath(target, start).replace('/', '\\')


def real(paths):
    return [p for p in paths if not p.endswith('_._')]


def has_reference(text, name):
    return re.search(r'<Reference\s+Include="%s(,|")' % re.escape(name), text, re.I) is not None


def build_plan(proj, pkgdir):
    text, _, _ = read_text(proj)
    assets_p = proj.parent / 'obj' / 'project.assets.json'
    if not assets_p.exists():
        sys.exit(f'{assets_p} missing. Run first:  MSBuild "{proj}" /t:Restore')
    assets = json.loads(assets_p.read_text(encoding='utf-8-sig'))

    direct = [m.lower() for m in re.findall(r'<PackageReference\s+Include="([^"]+)"', text, re.I)]
    if not direct:
        sys.exit('No <PackageReference> in the project - nothing to convert.')
    tfm = next(iter(assets['project']['frameworks']))
    declared = {k.lower() for k in assets['project']['frameworks'][tfm].get('dependencies', {})}
    if set(direct) != declared:
        sys.exit(f'project.assets.json is stale (project: {sorted(direct)}, assets: {sorted(declared)}). '
                 f'Run:  MSBuild "{proj}" /t:Restore')

    target = assets['targets'][next(k for k in assets['targets'] if '/' not in k)]
    pkgs = {}
    for key, v in target.items():
        if v.get('type') == 'package':
            pid, ver = key.split('/')
            pkgs[pid.lower()] = (pid, ver, v, assets['libraries'].get(key, {}))

    # Transitive closure over *package* deps only; packages that arrive via
    # ProjectReference stay with that project.
    chosen, stack = {}, list(direct)
    while stack:
        n = stack.pop()
        if n in chosen:
            continue
        if n not in pkgs:
            sys.exit(f'Package {n} not resolved in project.assets.json - restore again.')
        chosen[n] = pkgs[n]
        stack += [d.lower() for d in pkgs[n][2].get('dependencies', {})]

    plan = {'tfm': tfm, 'packages': [], 'refs': [], 'fwrefs': set(), 'props': [], 'targets': [], 'warnings': []}
    for pid, ver, v, lib in sorted(chosen.values(), key=lambda t: t[0].lower()):
        plan['packages'].append((pid, ver))
        root = pkgdir / f'{pid}.{ver}'
        compile_ = real(v.get('compile', {}))
        for f in compile_:
            plan['refs'].append((Path(f).stem, winrel(root / f, proj.parent)))
        for f in real(v.get('runtime', {})):
            if f not in compile_:
                plan['warnings'].append(f'{pid}: runtime-only assembly {f} gets no Reference - check it is still deployed.')
        plan['fwrefs'].update(v.get('frameworkAssemblies', []))
        for f in real(v.get('build', {})):
            if f.endswith('.props'):
                plan['props'].append(winrel(root / f, proj.parent))
            elif f.endswith('.targets'):
                plan['targets'].append(winrel(root / f, proj.parent))
        content = [f for f in lib.get('files', []) if f.startswith('content/')]
        if content or v.get('contentFiles'):
            plan['warnings'].append(f'{pid}: has content files ({", ".join(content[:3]) or "contentFiles"}) - '
                                    'not added to the project (PackageReference never added content/ either).')
    plan['fwrefs'] = sorted(r for r in plan['fwrefs'] if not has_reference(text, r))
    plan['refs'] = [r for r in plan['refs'] if not has_reference(text, r[0])]
    return plan


def packages_config(plan):
    lines = ['<?xml version="1.0" encoding="utf-8"?>', '<packages>']
    lines += [f'{I}<package id="{p}" version="{v}" targetFramework="{plan["tfm"]}" />' for p, v in plan['packages']]
    return '\n'.join(lines + ['</packages>', ''])


def import_line(path):
    return f'{I}<Import Project="{path}" Condition="Exists(\'{path}\')" />\n'


def apply(proj, plan):
    cfg = proj.parent / 'packages.config'
    if cfg.exists():
        sys.exit(f'{cfg} already exists - merge by hand.')
    text, bom, nl = read_text(proj)
    if 'EnsureNuGetPackageBuildImports' in text:
        sys.exit('Project already has an EnsureNuGetPackageBuildImports target - merge by hand.')
    if not LANG_TARGETS.search(text):
        sys.exit('Microsoft.CSharp/VisualBasic.targets Import not found - is this an SDK-style project?')

    text = PKGREF.sub('', text)
    text = RESTORE_STYLE.sub('', text)
    text = EMPTY_ITEMGROUP.sub('', text)

    # References: into the first ItemGroup that already holds <Reference>, else a new one.
    block = ''.join(f'{I*2}<Reference Include="{n}" />\n' for n in plan['fwrefs'])
    block += ''.join(f'{I*2}<Reference Include="{n}">\n{I*3}<HintPath>{h}</HintPath>\n{I*2}</Reference>\n'
                     for n, h in plan['refs'])
    if block:
        m = re.search(r'^[ \t]*<Reference\s+Include=', text, re.M)
        if m:
            text = text[:m.start()] + block + text[m.start():]
        else:
            m = LANG_TARGETS.search(text)
            text = text[:m.start()] + f'{I}<ItemGroup>\n{block}{I}</ItemGroup>\n' + text[m.start():]

    m = LANG_TARGETS.search(text)
    text = text[:m.start()] + f'{I}<ItemGroup>\n{I*2}<None Include="packages.config" />\n{I}</ItemGroup>\n' + text[m.start():]

    if plan['props']:
        m = COMMON_PROPS.search(text)
        pos = m.end() if m else text.index('\n', text.index('<Project')) + 1
        text = text[:pos] + ''.join(import_line(p) for p in plan['props']) + text[pos:]

    imports = plan['props'] + plan['targets']
    if plan['targets'] or imports:
        last = list(ANY_IMPORT.finditer(text))[-1]
        ins = ''.join(import_line(t) for t in plan['targets'])
        ins += (f'{I}<Target Name="EnsureNuGetPackageBuildImports" BeforeTargets="PrepareForBuild">\n'
                f'{I*2}<PropertyGroup>\n'
                f'{I*3}<ErrorText>This project references NuGet package(s) that are missing on this computer. '
                f'Use NuGet Package Restore to download them.  For more information, see '
                f'http://go.microsoft.com/fwlink/?LinkID=322105. The missing file is {{0}}.</ErrorText>\n'
                f'{I*2}</PropertyGroup>\n')
        ins += ''.join(f'{I*2}<Error Condition="!Exists(\'{p}\')" '
                       f'Text="$([System.String]::Format(\'$(ErrorText)\', \'{p}\'))" />\n' for p in imports)
        ins += f'{I}</Target>\n'
        text = text[:last.end()] + ins + text[last.end():]

    write_text(proj, text, bom, nl)
    cfg.write_bytes(packages_config(plan).replace('\n', '\r\n').encode('utf-8'))

    obj = proj.parent / 'obj'
    stale = [obj / 'project.assets.json', *obj.glob(f'{proj.name}.nuget.*')]
    for f in stale:
        if f.exists():
            f.unlink()
    print(f'Wrote {cfg}\nEdited {proj}\nDeleted {", ".join(f.name for f in stale)}')


def resolve_project(arg):
    """Accept a project path, or a project name (file stem) searched under the cwd.
    Several same-named files -> keep the ones listed in a *.sln; still ambiguous -> stop."""
    p = Path(arg)
    if p.is_file():
        return p.resolve()
    name = p.stem if p.suffix.lower() in ('.csproj', '.vbproj') else p.name
    hits = [h for ext in ('csproj', 'vbproj') for h in Path.cwd().rglob(f'{name}.{ext}')]
    hits = [h for h in hits if 'obj' not in h.parts and 'bin' not in h.parts]
    if len(hits) > 1:
        sln_text = ' '.join(s.read_text(encoding='utf-8-sig', errors='ignore').lower() for s in Path.cwd().rglob('*.sln'))
        in_sln = [h for h in hits if os.path.relpath(h, Path.cwd()).replace('/', '\\').lower() in sln_text
                  or '\\'.join(h.parts[-2:]).lower() in sln_text]
        hits = in_sln or hits
    if len(hits) != 1:
        sys.exit(f'Project "{arg}" ' + ('not found under ' + str(Path.cwd()) if not hits else
                 'is ambiguous - pass the path:\n  ' + '\n  '.join(str(h) for h in hits)))
    return hits[0].resolve()


def check(proj):
    text, _, _ = read_text(proj)
    paths = re.findall(r'<HintPath>([^<]*\\packages\\[^<]*)</HintPath>', text, re.I)
    paths += re.findall(r'<Import Project="([^"]*\\packages\\[^"]*)"', text, re.I)
    missing = [p for p in paths if not (proj.parent / p.replace('\\', os.sep)).exists()]
    left = re.findall(r'<PackageReference|<RestoreProjectStyle', text, re.I)
    for p in paths:
        print(('MISSING ' if p in missing else 'ok      ') + p)
    if left:
        print(f'STILL IN PROJECT: {len(left)} PackageReference/RestoreProjectStyle')
    sys.exit(1 if missing or left else 0)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('project', help='project name (e.g. SYNC.Lib.Server) or path to .csproj/.vbproj')
    ap.add_argument('--packages-dir', type=Path)
    g = ap.add_mutually_exclusive_group()
    g.add_argument('--apply', action='store_true')
    g.add_argument('--check', action='store_true')
    a = ap.parse_args()
    proj = resolve_project(a.project)
    print(f'project      : {proj.stem}  ({proj})')
    if a.check:
        check(proj)
    pkgdir = (a.packages_dir or default_packages_dir(proj)).resolve()
    plan = build_plan(proj, pkgdir)

    print(f'packages dir : {pkgdir}\n--- packages.config ---\n{packages_config(plan)}')
    print('--- References ---')
    for n in plan['fwrefs']:
        print(f'  {n} (framework)')
    for n, h in plan['refs']:
        print(f'  {n} -> {h}')
    for p in plan['props'] + plan['targets']:
        print(f'--- Import {p}')
    for w in plan['warnings']:
        print(f'WARNING {w}')
    if a.apply:
        apply(proj, plan)
    else:
        print('\nDry run - nothing changed. Re-run with --apply.')


if __name__ == '__main__':
    main()
