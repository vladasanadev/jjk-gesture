import { useEffect, useRef, useState } from 'react'
import type { HandTrackingResult, TrackedHand } from '../types/gestures'
import { getHandLandmarker } from '../utils/mediapipe'

export function useHandTracking(videoRef: React.RefObject<HTMLVideoElement>, ready: boolean) {
  const [result, setResult] = useState<HandTrackingResult>({ hands: [], timestamp: 0 })
  const rafRef = useRef<number>(0)
  const lastTs = useRef<number>(-1)

  useEffect(() => {
    if (!ready) return

    let stopped = false

    getHandLandmarker().then(landmarker => {
      if (stopped) return

      function loop() {
        if (stopped) return
        const video = videoRef.current
        if (video && video.readyState >= 2) {
          const ts = performance.now()
          if (ts !== lastTs.current) {
            lastTs.current = ts
            try {
              const detection = landmarker.detectForVideo(video, ts)
              const hands: TrackedHand[] = (detection.landmarks ?? []).map((lmArr, i) => ({
                landmarks: lmArr,
                handedness: (detection.handedness?.[i]?.[0]?.displayName ?? 'Right') as 'Left' | 'Right',
              }))
              setResult({ hands, timestamp: ts })
            } catch {
              // frame skipped
            }
          }
        }
        rafRef.current = requestAnimationFrame(loop)
      }

      loop()
    })

    return () => {
      stopped = true
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
  }, [ready, videoRef])

  return result
}
