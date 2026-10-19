export type LivePlan = {
  module: string
  plan: string
  path: string // project-root-relative, '' when the Plan cell has no link
  status: string
  detail: string
  youNow: string
  next: string
  updated: string
}

declare module 'claude-code' {
  interface PluginState {
    'mods-plan-status': {
      // 'missing' = no project-memory/project-memory-status.md here: draw nothing
      plans: LivePlan[] | 'missing' | 'unknown-format'
      isShown: boolean
    }
  }
}
