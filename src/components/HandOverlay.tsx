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
  const rafRef = useRef<number>(0)

  useEffect(() => {
    function draw() {
      const canvas = canvasRef.current
      if (!canvas) { rafRef.current = requestAnimationFrame(draw); return }
      const ctx = canvas.getContext('2d')
      if (!ctx) { rafRef.current = requestAnimationFrame(draw); return }

      const { width: w, height: h } = canvas
      ctx.clearRect(0, 0, w, h)

      for (const hand of tracking.hands) {
        drawHandSkeleton(ctx, hand.landmarks, w, h)
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [canvasRef, tracking])

  return null
}
