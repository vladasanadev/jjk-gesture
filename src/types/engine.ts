// Shared engine state shape — used by components and hooks
export interface GestureEngineState {
  activeGesture: string | null
  bestScore: number
  stableFrames: number
  fsmState: 'IDLE' | 'CHARGING' | 'COOLDOWN'
  cooldownRemaining: number
  gojoScore: number
  sukunaScore: number
}
