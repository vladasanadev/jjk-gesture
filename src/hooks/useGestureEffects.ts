import { useRef, useCallback } from 'react'
import type { PixiEffectsHandle } from '../components/PixiEffectsOverlay'
import type { GestureId } from '../types/gestures'
import type { EffectAnchors } from '../utils/effectAnchors'

/**
 * Thin hook that wraps PixiEffectsOverlay's imperative handle.
 * Call `playEffect` from the gesture engine when a gesture is stable.
 * The `onComplete` callback is invoked by the effect when the animation finishes.
 */
export function useGestureEffects(overlayRef: React.RefObject<PixiEffectsHandle | null>) {
  const playingRef = useRef(false)

  const playEffect = useCallback(
    (gestureId: GestureId, anchors: EffectAnchors, onComplete: () => void) => {
      if (playingRef.current) return
      const handle = overlayRef.current
      if (!handle) { onComplete(); return }
      playingRef.current = true
      handle.playEffect(gestureId, anchors, () => {
        playingRef.current = false
        onComplete()
      })
    },
    [overlayRef],
  )

  const updateAnchors = useCallback(
    (anchors: EffectAnchors) => {
      overlayRef.current?.updateAnchors(anchors)
    },
    [overlayRef],
  )

  const stopEffect = useCallback(() => {
    overlayRef.current?.stopEffect()
    playingRef.current = false
  }, [overlayRef])

  const isPlaying = () => playingRef.current

  return { playEffect, updateAnchors, stopEffect, isPlaying }
}
