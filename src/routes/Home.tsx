import { useRef, useState, useCallback, useEffect } from 'react'
import type { GestureId } from '../types/gestures'
import { useWebcam } from '../hooks/useWebcam'
import { useHandTracking } from '../hooks/useHandTracking'
import { useGestureEngine } from '../hooks/useGestureEngine'
import { useGestureEffects } from '../hooks/useGestureEffects'
import { triggerSkillAction } from '../utils/actionRouter'
import { CameraView } from '../components/CameraView'
import { HandOverlay } from '../components/HandOverlay'
import { StatusBadge } from '../components/StatusBadge'
import { DebugPanel } from '../components/DebugPanel'
import { PixiEffectsOverlay } from '../components/PixiEffectsOverlay'
import type { PixiEffectsHandle } from '../components/PixiEffectsOverlay'
import { computeEffectAnchors } from '../utils/effectAnchors'

export function Home() {
  const { videoRef, ready, error } = useWebcam()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pixiRef   = useRef<PixiEffectsHandle | null>(null)

  const [lastTriggered, setLastTriggered] = useState<string | null>(null)
  const [showDebug,     setShowDebug]     = useState(false)
  const [stageSize,     setStageSize]     = useState({ w: 640, h: 480 })

  const tracking = useHandTracking(videoRef, ready)
  const { playEffect, updateAnchors } = useGestureEffects(pixiRef)

  // Stable refs so callbacks don't go stale
  const trackingRef  = useRef(tracking)
  const stageSizeRef = useRef(stageSize)
  trackingRef.current  = tracking
  stageSizeRef.current = stageSize

  // Keep stage size in sync with the CSS-rendered video dimensions.
  // We intentionally use clientWidth/Height (display pixels) here, NOT
  // videoWidth/Height (intrinsic resolution). The Pixi canvas is sized to
  // the display dimensions so effects stay inside the container bounds.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    function update() {
      if (!video) return
      const w = video.clientWidth  || 640
      const h = video.clientHeight || 480
      setStageSize({ w, h })
    }
    video.addEventListener('loadedmetadata', update)
    const ro = new ResizeObserver(update)
    ro.observe(video)
    update()
    return () => { video.removeEventListener('loadedmetadata', update); ro.disconnect() }
  }, [videoRef])

  // Ref so onGestureTrigger can always reach the latest engine.onChargeComplete
  const onChargeCompleteRef = useRef<() => void>(() => undefined)

  const onGestureTrigger = useCallback((gesture: GestureId) => {
    setLastTriggered(gesture)
    const { hands } = trackingRef.current
    const { w, h }  = stageSizeRef.current
    const anchors   = computeEffectAnchors(hands, w, h)
    playEffect(gesture, anchors, () => {
      triggerSkillAction(gesture)
      onChargeCompleteRef.current()   // advance FSM → COOLDOWN
    })
  }, [playEffect])

  const engine = useGestureEngine(onGestureTrigger)
  onChargeCompleteRef.current = engine.onChargeComplete

  // Drive the gesture engine from tracking updates — in useEffect, NOT in render
  useEffect(() => {
    engine.processFrame(tracking)
    const { w, h } = stageSizeRef.current
    const anchors  = computeEffectAnchors(tracking.hands, w, h)
    updateAnchors(anchors)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracking.timestamp])

  const handedness = tracking.hands.map(h => h.handedness)

  return (
    <div className="home">
      <header className="home-header">
        <h1>Gesture Skill Router</h1>
      </header>

      {error && <div className="error-banner">Camera error: {error}</div>}

      <div className="stage-wrapper">
        <CameraView videoRef={videoRef} canvasRef={canvasRef} ready={ready} />
        <HandOverlay canvasRef={canvasRef} tracking={tracking} engineState={engine.state} />
        <PixiEffectsOverlay
          ref={pixiRef}
          width={stageSize.w}
          height={stageSize.h}
          style={{ transform: 'scaleX(-1)' }}
        />
      </div>

      <StatusBadge
        handCount={tracking.hands.length}
        engineState={engine.state}
        lastTriggered={lastTriggered}
      />

      <div className="legend">
        <div className="legend-row">
          <span className="legend-gesture">Gojo crossed fingers</span>
          <span className="legend-arrow">→</span>
          <span className="legend-action legend-purple">GitHub PR Review</span>
        </div>
        <div className="legend-row">
          <span className="legend-gesture">Sukuna two-hand seal</span>
          <span className="legend-arrow">→</span>
          <span className="legend-action legend-red">Security Threat Model</span>
        </div>
      </div>

      <button className="debug-toggle" onClick={() => setShowDebug(d => !d)}>
        {showDebug ? 'Hide debug' : 'Debug'}
      </button>

      <DebugPanel
        show={showDebug}
        engineState={engine.state}
        handCount={tracking.hands.length}
        handedness={handedness}
        chargeProgress={0}
        chargeGesture={null}
      />
    </div>
  )
}
