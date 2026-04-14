import { useRef, useEffect } from 'react'
import type { HandTrackingResult } from '../types/gestures'
import type { GestureEngineState } from '../types/engine'
import { drawHandSkeleton } from '../utils/drawHands'

interface Props {
  canvasRef: React.RefObject<HTMLCanvasElement>
  tracking: HandTrackingResult
  engineState: GestureEngineState
}

export function HandOverlay({ canvasRef, tracking }: Props) {
  // Always-current tracking data without triggering RAF restarts
  const trackingRef = useRef(tracking)
  trackingRef.current = tracking

  // Single stable RAF loop — runs for the component's lifetime
  useEffect(() => {
    let rafId = 0

    function draw() {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (canvas && ctx) {
        const { width: w, height: h } = canvas
        ctx.clearRect(0, 0, w, h)
        for (const hand of trackingRef.current.hands) {
          drawHandSkeleton(ctx, hand.landmarks, w, h)
        }
      }
      rafId = requestAnimationFrame(draw)
    }

    rafId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafId)
  }, [canvasRef])

  return null
}
