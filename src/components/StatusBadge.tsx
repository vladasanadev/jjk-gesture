import type { GestureEngineState } from '../types/engine'

interface Props {
  handCount: number
  engineState: GestureEngineState
  lastTriggered: string | null
}

const GESTURE_LABELS: Record<string, string> = {
  gojo_crossed_fingers: 'Gojo crossed fingers',
  sukuna_two_hand_seal: 'Sukuna two-hand seal',
}

const FSM_LABELS: Record<string, string> = {
  IDLE: 'idle',
  CHARGING: 'charging…',
  COOLDOWN: 'cooldown',
}

export function StatusBadge({ handCount, engineState, lastTriggered }: Props) {
  const { fsmState, activeGesture } = engineState

  return (
    <div className="status-bar">
      <span className={`pill ${handCount > 0 ? 'pill-green' : 'pill-dim'}`}>
        {handCount > 0 ? `${handCount} hand${handCount > 1 ? 's' : ''}` : 'no hands'}
      </span>

      <span className={`pill ${fsmState === 'CHARGING' ? 'pill-purple' : fsmState === 'COOLDOWN' ? 'pill-red' : 'pill-dim'}`}>
        {fsmState === 'CHARGING' && activeGesture
          ? `${GESTURE_LABELS[activeGesture] ?? activeGesture}`
          : FSM_LABELS[fsmState]}
      </span>

      {lastTriggered && (
        <span className="pill pill-dim">
          last: {GESTURE_LABELS[lastTriggered] ?? lastTriggered}
        </span>
      )}
    </div>
  )
}
