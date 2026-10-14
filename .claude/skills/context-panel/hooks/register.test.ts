import { expect, test } from 'claude-code/testing'

import { barCells, fmt, pct } from './register'

test('fmt and pct match /context', () => {
  expect(fmt(595)).toBe('595')
  expect(fmt(39900)).toBe('39.9k')
  expect(fmt(1000000)).toBe('1M')
  expect(pct(233000, 1e6)).toBe('23%')
  expect(pct(21000, 1e6)).toBe('2.1%')
  expect(pct(494, 1e6)).toBe('<0.1%')
})

test('barCells fills the width, tiny categories still show, buffer last', () => {
  const cat = (name: string, tokens: number, kind: string) => ({ name, tokens, kind, color: 'text', isDeferred: false })
  const bar = barCells(
    {
      rawMaxTokens: 1000,
      categories: [
        cat('System prompt', 1, 'used'),
        cat('Autocompact buffer', 100, 'buffer'),
        cat('Messages', 400, 'used'),
        cat('MCP tools', 50, 'deferred'),
        cat('Free space', 499, 'free'),
      ],
    },
    20,
  )
  expect(bar.used.map(x => x.n)).toEqual([1, 8])
  expect(bar.buffer?.n).toBe(2)
  expect(bar.free).toBe(9)
})

for (const surface of ['terminal', 'desktop'] as const) {
  test(`/context-panel show|hide opens and closes the pane, which draws the header on ${surface}`, async ($, on) => {
    const open = new Set<string>()
    on('session.usage', () => ({ value: { startedAt: 0, context: { window: 1e6 }, rateLimits: [] } }))
    on('ui.open', ($, e) => {
      open.add(e.id)
      return { value: { isPlaced: true } }
    })
    on('ui.close', ($, e) => {
      open.delete(e.id)
      return { value: undefined }
    })
    await $.command.run({ command: 'context-panel', args: 'show' })
    expect(open.has('context-panel')).toBe(true)

    const pane = await $.ui.mount({
      plugin: 'context-panel',
      surface,
      component: 'Pane',
      requestId: 'context-panel',
      props: { title: 'Context', isFocused: false, bodyColumns: 40, placement: 'dock', scroll: { offset: 0, bodyRows: 20 }, view: {} },
    })
    expect(await pane.find({ key: 'refresh' })).toBeDefined()

    await $.command.run({ command: 'context-panel', args: 'hide' })
    expect(open.has('context-panel')).toBe(false)
  })
}
