import { expect, test } from 'claude-code/testing'

import { TABLE_FORMAT } from './parse'

const md = [
  '## Live work — 1 plan(s) not Done',
  '',
  TABLE_FORMAT,
  '',
  '| Module | Plan | Status | Detail | You now | Next | Updated |',
  '|---|---|---|---|---|---|---|',
  '| sales-module | [orders-export.md](x) | Building | 2/5 | test task 2 | task 3 | 2026-10-01 |',
].join('\n')

for (const surface of ['terminal', 'desktop'] as const) {
  test(`pane starts hidden, and /mods-plan-status show|hide opens it with the plans and closes it on ${surface}`, async ($, on) => {
    const open = new Set<string>()
    on('session.root', () => ({ value: '/proj' }))
    on('fs.read', () => ({ value: md }))
    on('ui.open', ($, e) => {
      open.add(e.id)
      return { value: { isPlaced: true } }
    })
    on('ui.close', ($, e) => {
      open.delete(e.id)
      return { value: undefined }
    })
    on('classic.SessionStart', () => ({}))
    const filled: string[] = []
    on('prompt.fill', ($, e) => {
      filled.push(e.text)
      return { isFilled: true, text: e.text, cursor: e.text.length }
    })
    await $.classic.SessionStart({ source: 'clear' }) // runs setShown, as /clear does in a session
    expect(open.has('mods-plan-status')).toBe(false)
    await $.command.run({ command: 'mods-plan-status', args: 'show' })
    expect(open.has('mods-plan-status')).toBe(true)

    const pane = await $.ui.mount({
      plugin: 'mods-plan-status',
      surface,
      component: 'Pane',
      requestId: 'mods-plan-status',
      props: {
        title: 'Plans',
        isFocused: false,
        bodyColumns: 40,
        placement: 'dock',
        scroll: { offset: 0, bodyRows: 20 },
        view: {},
      },
    })
    expect(await pane.find({ text: /1 live plan/ })).toBeDefined()
    expect(await pane.find({ text: 'orders-export.md' })).toBeDefined()
    expect(await pane.find({ text: 'sales-module' })).toBeUndefined() // no module level: the plan file is the root
    expect(await pane.find({ text: '└─ ' })).toBeDefined()
    expect(await pane.find({ text: /You now: test task 2/ })).toBeDefined()
    expect(await pane.find({ text: /Next: task 3/ })).toBeDefined()

    // pressing the plan name puts its path, @-prefixed, in the prompt box
    await pane.press({ key: 'project-memory/x' })
    expect(filled).toEqual(['@project-memory/x '])

    await $.command.run({ command: 'mods-plan-status', args: 'hide' })
    expect(open.has('mods-plan-status')).toBe(false)
    await $.command.run({ command: 'mods-plan-status', args: 'show' })
    expect(open.has('mods-plan-status')).toBe(true)
  })
}
