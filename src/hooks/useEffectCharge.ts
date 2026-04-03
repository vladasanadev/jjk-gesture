import { useRef, useState, useEffect, useCallback } from 'react'
import type { GestureId } from '../types/gestures'
import { GESTURE_CONFIG } from '../utils/gestureConfig'

type Phase = 'idle' | 'charging' | 'done'

interface EffectCharge {
  phase: Phase
  progress: number  // 0→1 during charging
  gesture: GestureId | null
}

export function useEffectCharge(onComplete: () => void) {
  const [charge, setCharge] = useState<EffectCharge>({ phase: 'idle', progress: 0, gesture: null })
  const startRef = useRef<number>(0)
  const rafRef = useRef<number>(0)
  const gestureRef = useRef<GestureId | null>(null)
  const activeRef = useRef(false)

  const start = useCallback((gesture: GestureId) => {
    if (activeRef.current) return
    activeRef.current = true
    gestureRef.current = gesture
    startRef.current = performance.now()

    function tick(now: number) {
      const elapsed = now - startRef.current
      const progress = Math.min(elapsed / GESTURE_CONFIG.chargeDurationMs, 1)
      setCharge({ phase: 'charging', progress, gesture: gestureRef.current })

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setCharge({ phase: 'done', progress: 1, gesture: gestureRef.current })
        activeRef.current = false
        onComplete()
        // Reset after brief delay
        setTimeout(() => setCharge({ phase: 'idle', progress: 0, gesture: null }), 300)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [onComplete])

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  return { charge, startCharge: start }
}
