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
    // Container div owns the layout; Pixi appends its own canvas inside it.
    // This avoids the StrictMode problem of passing the same HTMLCanvasElement
    // to two successive Pixi Application instances (the second GL context init
    // can silently fail on some browsers).
    const containerRef = useRef<HTMLDivElement>(null)
    const appRef       = useRef<Application | null>(null)
    const gojoRef      = useRef<GojoEffect | null>(null)
    const sukunaRef    = useRef<SukunaEffect | null>(null)
    const anchorsRef   = useRef<EffectAnchors | null>(null)
    const activeRef    = useRef<GojoEffect | SukunaEffect | null>(null)

    // Initialize Pixi once per mount; cleanup removes the canvas from DOM
    useEffect(() => {
      const container = containerRef.current
      if (!container) return

      let destroyed = false
      const app = new Application()

      app.init({
        width,
        height,
        backgroundAlpha: 0,
        antialias: true,
        resolution: Math.min(window.devicePixelRatio ?? 1, 2),
        autoDensity: true,
      }).then(() => {
        if (destroyed) { app.destroy(true); return }

        // Style Pixi's own canvas and mount it inside the container
        const canvas = app.canvas as HTMLCanvasElement
        Object.assign(canvas.style, {
          position: 'absolute',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        })
        container.appendChild(canvas)

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
        appRef.current?.destroy(true)   // true = remove Pixi's canvas from DOM
        appRef.current = null
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Resize the Pixi renderer when display dimensions change
    useEffect(() => {
      appRef.current?.renderer.resize(width, height)
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
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          // Spread caller styles last so transform:scaleX(-1) is applied to
          // the container (and thus to Pixi's child canvas).
          ...style,
        }}
      />
    )
  }
)
