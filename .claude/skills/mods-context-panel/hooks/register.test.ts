import { expect, test } from 'claude-code/testing'

import { barCells, fmt, gridRows, pct } from './register'

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

test('gridRows fills the given width in █ ░ cells, buffer last', () => {
  const cat = (name: string, tokens: number, kind: string) => ({ name, tokens, kind, color: 'text', isDeferred: false })
  const rows = gridRows(
    { rawMaxTokens: 1000, categories: [cat('System', 1, 'used'), cat('Messages', 300, 'used'), cat('Autocompact buffer', 50, 'buffer'), cat('Free space', 649, 'free')] },
    39,
  )
  expect(rows.map(r => r.length)).toEqual([20, 20, 20, 20, 20])
  const glyphs = rows.flat().map(x => x.glyph).join('')
  expect(glyphs.startsWith('██')).toBe(true)
  expect(glyphs.endsWith('░█████')).toBe(true)
  expect(rows[0][0].color).toBe('text') // used cells carry their color; free and buffer are drawn dim
})

test('the pane draws each category as an aligned row, and an opened section lists its rows', async ($, on) => {
  const cat = (name: string, tokens: number, kind: string) => ({ name, tokens, kind, color: 'text', isDeferred: false })
  const breakdown = {
    categories: [cat('Messages', 40000, 'used'), cat('Autocompact buffer', 33000, 'buffer'), cat('Free space', 127000, 'free')],
    totalTokens: 40000,
    rawMaxTokens: 200000,
    percentage: 20,
    gridRows: [],
    model: 'm',
    memoryFiles: [{ path: 'CLAUDE.md', type: 'Project', tokens: 1200 }],
    mcpTools: [],
    agents: [],
    isAutoCompactEnabled: false,
  }
  on('session.usage', () => ({ value: { startedAt: 0, context: { window: 200000, breakdown }, rateLimits: [] } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  await $.command.run({ command: 'mods-context-panel', args: 'show' })

  const pane = await $.ui.mount({
    plugin: 'mods-context-panel',
    surface: 'terminal',
    component: 'Pane',
    requestId: 'mods-context-panel',
    props: { title: 'Context', isFocused: false, bodyColumns: 40, placement: 'dock', scroll: { offset: 0, bodyRows: 30 }, view: {} },
  })
  expect(await pane.find({ type: 'Text', text: '40k' })).toBeDefined()
  expect(await pane.find({ type: 'Text', text: '20%' })).toBeDefined()
  expect(await pane.find({ type: 'Text', text: /free space/ })).toBeDefined()
  expect(await pane.find({ type: 'Text', text: 'CLAUDE.md' })).toBeUndefined()
  await pane.press({ key: 'sec-memory' })
  expect(await pane.find({ type: 'Text', text: 'CLAUDE.md' })).toBeDefined()
})

for (const surface of ['terminal', 'desktop'] as const) {
  test(`/mods-context-panel show|hide opens and closes the pane, which draws the header on ${surface}`, async ($, on) => {
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
    await $.command.run({ command: 'mods-context-panel', args: 'show' })
    expect(open.has('mods-context-panel')).toBe(true)

    const pane = await $.ui.mount({
      plugin: 'mods-context-panel',
      surface,
      component: 'Pane',
      requestId: 'mods-context-panel',
      props: { title: 'Context', isFocused: false, bodyColumns: 40, placement: 'dock', scroll: { offset: 0, bodyRows: 20 }, view: {} },
    })
    expect(await pane.find({ key: 'refresh' })).toBeDefined()

    await $.command.run({ command: 'mods-context-panel', args: 'hide' })
    expect(open.has('mods-context-panel')).toBe(false)
  })
}
