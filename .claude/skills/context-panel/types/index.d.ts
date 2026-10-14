// The slice of $.session.usage({ breakdown })'s context the pane draws.
export type Breakdown = {
  categories: { name: string; tokens: number; color: string; isDeferred: boolean; kind: string }[]
  totalTokens: number
  rawMaxTokens: number
  percentage: number
  gridRows: { color: string; categoryName: string; squareFullness: number }[][]
  model: string
  memoryFiles: { path: string; type: string; tokens: number }[]
  mcpTools: { name: string; serverName: string; tokens: number; isLoaded: boolean }[]
  agents: { agentType: string; source: string; tokens: number }[]
  slashCommands?: { totalCommands: number; includedCommands: number; tokens: number }
  skills?: {
    totalSkills: number
    includedSkills: number
    tokens: number
    skillFrontmatter: { name: string; source: string; pluginName?: string; tokens: number }[]
  }
  autoCompactThreshold?: number
  isAutoCompactEnabled: boolean
}

export type Snapshot = {
  tokens?: number
  window: number
  percent?: number
  breakdown: Breakdown | null
  detail?: 'summary' | 'full'
}

declare module 'claude-code' {
  interface PluginState {
    'context-panel': { snap: Snapshot | null; isShown: boolean; sections: string[] }
  }
}
