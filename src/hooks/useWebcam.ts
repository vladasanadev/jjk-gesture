import { useEffect, useRef, useState } from 'react'

interface WebcamState {
  ready: boolean
  error: string | null
}

export function useWebcam() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [state, setState] = useState<WebcamState>({ ready: false, error: null })

  useEffect(() => {
    let cancelled = false

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: 1280, height: 720 } })
      .then(stream => {
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            if (!cancelled) setState({ ready: true, error: null })
          }
        }
      })
      .catch(err => {
        if (!cancelled) setState({ ready: false, error: (err as Error).message })
      })

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  return { videoRef, ...state }
}
