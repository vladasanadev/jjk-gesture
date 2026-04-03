import { useRef, useState, useCallback } from 'react'
import type { GestureId } from '../types/gestures'
import { useWebcam } from '../hooks/useWebcam'
import { useHandTracking } from '../hooks/useHandTracking'
import { useGestureEngine } from '../hooks/useGestureEngine'
import { useEffectCharge } from '../hooks/useEffectCharge'
import { triggerSkillAction } from '../utils/actionRouter'
import { GESTURE_CONFIG } from '../utils/gestureConfig'
import { CameraView } from '../components/CameraView'
import { HandOverlay } from '../components/HandOverlay'
import { StatusBadge } from '../components/StatusBadge'
import { DebugPanel } from '../components/DebugPanel'

export function Home() {
  const { videoRef, ready, error } = useWebcam()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tracking = useHandTracking(videoRef, ready)
  const [lastTriggered, setLastTriggered] = useState<string | null>(null)
  const [showDebug, setShowDebug] = useState(false)

  // Use a ref so the charge-complete callback can call engine.onChargeComplete
  // without creating a dependency cycle between the two hooks.
  const onChargeCompleteRef = useRef<() => void>(() => undefined)

  const { charge, startCharge } = useEffectCharge(
    useCallback(() => onChargeCompleteRef.current(), [])
  )

  const onGestureTrigger = useCallback((gesture: GestureId) => {
    setLastTriggered(gesture)
    startCharge(gesture)
    setTimeout(() => triggerSkillAction(gesture), GESTURE_CONFIG.chargeDurationMs)
  }, [startCharge])

  const engine = useGestureEngine(onGestureTrigger)

  // Wire the ref so the charge-complete handler can always reach the latest engine
  onChargeCompleteRef.current = engine.onChargeComplete

  // Process each new frame — read-only mutation of a ref, safe outside render
  const prevTs = useRef(0)
  if (tracking.timestamp !== prevTs.current) {
    prevTs.current = tracking.timestamp
    engine.processFrame(tracking)
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
        <HandOverlay
          canvasRef={canvasRef}
          tracking={tracking}
          engineState={engine.state}
          chargeProgress={charge.progress}
          chargeGesture={charge.gesture}
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
        chargeProgress={charge.progress}
        chargeGesture={charge.gesture}
      />
    </div>
  )
}
