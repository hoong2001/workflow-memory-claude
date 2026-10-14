export type ModShown = boolean

declare module 'claude-code' {
  interface PluginState {
    'mod-panel': { isShown: ModShown }
    // read-only mirrors of the keys this band reads; each owner's contract declares the same type
    'plan-status': { isShown: boolean }
    'context-panel': { isShown: boolean }
  }
}
