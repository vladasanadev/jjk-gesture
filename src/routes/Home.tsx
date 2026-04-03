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
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const pixiRef     = useRef<PixiEffectsHandle | null>(null)
  const [lastTriggered, setLastTriggered] = useState<string | null>(null)
  const [showDebug,     setShowDebug]     = useState(false)
  const [stageSize,     setStageSize]     = useState({ w: 640, h: 480 })

  const tracking = useHandTracking(videoRef, ready)
  const { playEffect, updateAnchors } = useGestureEffects(pixiRef)

  // Track stage dimensions from the video element
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    function update() {
      if (!video) return
      const w = video.videoWidth  || video.clientWidth  || 640
      const h = video.videoHeight || video.clientHeight || 480
      setStageSize({ w, h })
    }
    video.addEventListener('loadedmetadata', update)
    const ro = new ResizeObserver(update)
    ro.observe(video)
    update()
    return () => { video.removeEventListener('loadedmetadata', update); ro.disconnect() }
  }, [videoRef])

  const onGestureTrigger = useCallback((gesture: GestureId) => {
    setLastTriggered(gesture)
    const anchors = computeEffectAnchors(tracking.hands, stageSize.w, stageSize.h)
    playEffect(gesture, anchors, () => triggerSkillAction(gesture))
  }, [playEffect, tracking.hands, stageSize])

  const engine = useGestureEngine(onGestureTrigger)

  // Process tracking frames outside of render
  const prevTs = useRef(0)
  if (tracking.timestamp !== prevTs.current) {
    prevTs.current = tracking.timestamp
    engine.processFrame(tracking)
    // Keep Pixi anchors live during effect playback
    const anchors = computeEffectAnchors(tracking.hands, stageSize.w, stageSize.h)
    updateAnchors(anchors)
  }

  const handedness = tracking.hands.map(h => h.handedness)

  return (
    <div className="home">
      <header className="home-header">
        <h1>Gesture Skill Router</h1>
      </header>

      {error && (
        <div className="error-banner">Camera error: {error}</div>
      )}

      <div className="stage-wrapper">
        <CameraView videoRef={videoRef} canvasRef={canvasRef} ready={ready} />
        {/* Skeleton landmarks layer */}
        <HandOverlay canvasRef={canvasRef} tracking={tracking} engineState={engine.state} />
        {/* Pixi anime effects layer */}
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
