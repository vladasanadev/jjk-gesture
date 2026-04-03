import { useRef, useEffect } from 'react'
import type { HandTrackingResult } from '../types/gestures'
import type { GestureEngineState } from '../types/engine'
import { drawHandSkeleton } from '../utils/drawHands'
import { drawGojoEffect, drawSukunaEffect } from '../utils/drawEffects'

interface Props {
  canvasRef: React.RefObject<HTMLCanvasElement>
  tracking: HandTrackingResult
  engineState: GestureEngineState
  chargeProgress: number
  chargeGesture: string | null
}

export function HandOverlay({ canvasRef, tracking, chargeProgress, chargeGesture }: Props) {
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

      if (chargeGesture === 'gojo_crossed_fingers' && chargeProgress > 0) {
        drawGojoEffect(ctx, tracking.hands, chargeProgress, w, h)
      } else if (chargeGesture === 'sukuna_two_hand_seal' && chargeProgress > 0) {
        drawSukunaEffect(ctx, tracking.hands, chargeProgress, w, h)
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [canvasRef, tracking, chargeProgress, chargeGesture])

  return null
}
