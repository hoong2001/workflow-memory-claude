import { expect, test } from 'claude-code/testing'

import { TABLE_FORMAT } from './parse'

const md = [
  '## Live work — 1 plan(s) not Done',
  '',
  TABLE_FORMAT,
  '',
  '| Module | Plan | Status | Detail | Updated |',
  '|---|---|---|---|---|',
  '| orders | [orders-export.md](x) | Building | 2/5 | 2026-10-01 |',
].join('\n')

for (const surface of ['terminal', 'desktop'] as const) {
  test(`pane starts hidden, and /plan-status show|hide opens it with the plans and closes it on ${surface}`, async ($, on) => {
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
    await $.classic.SessionStart({ source: 'clear' }) // runs setShown, as /clear does in a session
    expect(open.has('plan-status')).toBe(false)
    await $.command.run({ command: 'plan-status', args: 'show' })
    expect(open.has('plan-status')).toBe(true)

    const pane = await $.ui.mount({
      plugin: 'plan-status',
      surface,
      component: 'Pane',
      requestId: 'plan-status',
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

    await $.command.run({ command: 'plan-status', args: 'hide' })
    expect(open.has('plan-status')).toBe(false)
    await $.command.run({ command: 'plan-status', args: 'show' })
    expect(open.has('plan-status')).toBe(true)
  })
}
