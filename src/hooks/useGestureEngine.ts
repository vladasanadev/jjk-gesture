import { useRef, useState, useCallback } from 'react'
import type { GestureId, GestureResult, HandTrackingResult } from '../types/gestures'
import { GESTURE_CONFIG } from '../utils/gestureConfig'
import { matchGojoCrossedFingers, matchSukunaTwoHandSeal } from '../utils/gestureMatchers'

type FSMState = 'IDLE' | 'CHARGING' | 'COOLDOWN'

interface GestureEngineState {
  activeGesture: GestureId | null
  bestScore: number
  stableFrames: number
  fsmState: FSMState
  cooldownRemaining: number
  gojoScore: number
  sukunaScore: number
}

export function useGestureEngine(onTrigger: (g: GestureId) => void) {
  const [state, setState] = useState<GestureEngineState>({
    activeGesture: null, bestScore: 0, stableFrames: 0,
    fsmState: 'IDLE', cooldownRemaining: 0,
    gojoScore: 0, sukunaScore: 0,
  })

  const fsmRef = useRef<FSMState>('IDLE')
  const stableRef = useRef(0)
  const lostRef = useRef(0)
  const candidateRef = useRef<GestureId | null>(null)
  const cooldownEndRef = useRef(0)
  const triggeredRef = useRef(false)

  // Called from the draw loop each frame
  const processFrame = useCallback((tracking: HandTrackingResult) => {
    const { hands } = tracking
    const now = Date.now()

    const gojoResult: GestureResult = matchGojoCrossedFingers(hands)
    const sukunaResult: GestureResult = matchSukunaTwoHandSeal(hands)

    // Pick best gesture above threshold
    let best: GestureResult | null = null
    for (const r of [gojoResult, sukunaResult]) {
      if (r.score >= GESTURE_CONFIG.scoreThreshold) {
        if (!best || r.score > best.score) best = r
      }
    }

    const cooldownRemaining = Math.max(0, cooldownEndRef.current - now)

    if (fsmRef.current === 'COOLDOWN') {
      if (cooldownRemaining <= 0) {
        fsmRef.current = 'IDLE'
        triggeredRef.current = false
      }
      setState(s => ({ ...s, fsmState: 'COOLDOWN', cooldownRemaining, gojoScore: gojoResult.score, sukunaScore: sukunaResult.score }))
      return
    }

    if (fsmRef.current === 'CHARGING') {
      // Already charging — managed by useEffectCharge; just update scores
      setState(s => ({ ...s, fsmState: 'CHARGING', gojoScore: gojoResult.score, sukunaScore: sukunaResult.score }))
      return
    }

    // IDLE
    if (best) {
      if (best.id === candidateRef.current) {
        lostRef.current = 0
        stableRef.current++
      } else {
        candidateRef.current = best.id
        stableRef.current = 1
        lostRef.current = 0
      }

      if (stableRef.current >= GESTURE_CONFIG.stableFramesRequired) {
        fsmRef.current = 'CHARGING'
        onTrigger(best.id)
        setState(s => ({
          ...s,
          activeGesture: best!.id,
          bestScore: best!.score,
          stableFrames: stableRef.current,
          fsmState: 'CHARGING',
          gojoScore: gojoResult.score,
          sukunaScore: sukunaResult.score,
        }))
        return
      }
    } else {
      lostRef.current++
      if (lostRef.current >= GESTURE_CONFIG.lostFramesTolerance) {
        stableRef.current = 0
        candidateRef.current = null
      }
    }

    setState(s => ({
      ...s,
      activeGesture: best?.id ?? null,
      bestScore: best?.score ?? 0,
      stableFrames: stableRef.current,
      fsmState: 'IDLE',
      gojoScore: gojoResult.score,
      sukunaScore: sukunaResult.score,
    }))
  }, [onTrigger])

  const onChargeComplete = useCallback(() => {
    fsmRef.current = 'COOLDOWN'
    cooldownEndRef.current = Date.now() + GESTURE_CONFIG.cooldownMs
    stableRef.current = 0
    candidateRef.current = null
  }, [])

  return { state, processFrame, onChargeComplete }
}
