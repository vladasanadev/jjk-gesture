import type { GestureEngineState } from '../types/engine'

interface Props {
  show: boolean
  engineState: GestureEngineState
  handCount: number
  handedness: string[]
  chargeProgress: number
  chargeGesture: string | null
}

export function DebugPanel({ show, engineState, handCount, handedness, chargeProgress, chargeGesture }: Props) {
  if (!show) return null
  const { gojoScore, sukunaScore, stableFrames, fsmState, cooldownRemaining } = engineState

  return (
    <div className="debug-panel">
      <div className="debug-row"><span>hands</span><span>{handCount}</span></div>
      <div className="debug-row"><span>handedness</span><span>{handedness.join(', ') || '—'}</span></div>
      <div className="debug-row"><span>gojo score</span><span>{gojoScore.toFixed(2)}</span></div>
      <div className="debug-row"><span>sukuna score</span><span>{sukunaScore.toFixed(2)}</span></div>
      <div className="debug-row"><span>stable frames</span><span>{stableFrames}</span></div>
      <div className="debug-row"><span>FSM state</span><span>{fsmState}</span></div>
      <div className="debug-row"><span>cooldown</span><span>{cooldownRemaining > 0 ? `${(cooldownRemaining / 1000).toFixed(1)}s` : '—'}</span></div>
      <div className="debug-row"><span>charge progress</span><span>{(chargeProgress * 100).toFixed(0)}%</span></div>
      <div className="debug-row"><span>active effect</span><span>{chargeGesture ?? '—'}</span></div>
    </div>
  )
}
