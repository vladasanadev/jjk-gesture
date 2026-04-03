import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react'
import { Application } from 'pixi.js'
import { GojoEffect } from '../utils/effects/gojoEffect'
import { SukunaEffect } from '../utils/effects/sukunaEffect'
import type { EffectAnchors } from '../utils/effectAnchors'
import type { GestureId } from '../types/gestures'

export interface PixiEffectsHandle {
  playEffect(gestureId: GestureId, anchors: EffectAnchors, onComplete: () => void): void
  updateAnchors(anchors: EffectAnchors): void
  stopEffect(): void
}

interface Props {
  width: number
  height: number
  style?: React.CSSProperties
}

export const PixiEffectsOverlay = forwardRef<PixiEffectsHandle, Props>(
  function PixiEffectsOverlay({ width, height, style }, ref) {
    const canvasRef   = useRef<HTMLCanvasElement>(null)
    const appRef      = useRef<Application | null>(null)
    const gojoRef     = useRef<GojoEffect | null>(null)
    const sukunaRef   = useRef<SukunaEffect | null>(null)
    const anchorsRef  = useRef<EffectAnchors | null>(null)
    const activeRef   = useRef<GojoEffect | SukunaEffect | null>(null)

    // Initialize Pixi once
    useEffect(() => {
      let destroyed = false
      const canvas = canvasRef.current
      if (!canvas) return

      const app = new Application()
      app.init({
        canvas,
        width,
        height,
        backgroundAlpha: 0,
        antialias: true,
        resolution: Math.min(window.devicePixelRatio ?? 1, 2),
        autoDensity: true,
      }).then(() => {
        if (destroyed) { app.destroy(); return }
        appRef.current = app

        const gojo   = new GojoEffect(width, height)
        const sukuna = new SukunaEffect(width, height)
        gojoRef.current   = gojo
        sukunaRef.current = sukuna
        app.stage.addChild(gojo.root, sukuna.root)

        app.ticker.add((ticker) => {
          const dt      = ticker.deltaMS
          const active  = activeRef.current
          const anchors = anchorsRef.current
          if (active && anchors) active.tick(dt, anchors)
        })
      })

      return () => {
        destroyed = true
        gojoRef.current?.destroy()
        sukunaRef.current?.destroy()
        gojoRef.current   = null
        sukunaRef.current = null
        activeRef.current = null
        appRef.current?.destroy(false)
        appRef.current = null
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Resize when dimensions change
    useEffect(() => {
      const app = appRef.current
      if (!app) return
      app.renderer.resize(width, height)
    }, [width, height])

    useImperativeHandle(ref, () => ({
      playEffect(gestureId: GestureId, anchors: EffectAnchors, onComplete: () => void) {
        activeRef.current?.stop()
        anchorsRef.current = anchors
        const effect = gestureId === 'gojo_crossed_fingers' ? gojoRef.current : sukunaRef.current
        if (!effect) { onComplete(); return }
        activeRef.current = effect
        effect.play(anchors, () => {
          activeRef.current = null
          onComplete()
        })
      },
      updateAnchors(anchors: EffectAnchors) {
        anchorsRef.current = anchors
      },
      stopEffect() {
        activeRef.current?.stop()
        activeRef.current = null
      },
    }))

    return (
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width, height,
          pointerEvents: 'none',
          ...style,
        }}
      />
    )
  }
)
