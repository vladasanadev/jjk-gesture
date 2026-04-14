import { useEffect, useRef, useState } from 'react'

interface WebcamState {
  ready: boolean
  error: string | null
}

export function useWebcam() {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [state, setState] = useState<WebcamState>({ ready: false, error: null })

  useEffect(() => {
    let cancelled = false

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: 1280, height: 720 } })
      .then(stream => {
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        const video = videoRef.current
        if (!video) { stream.getTracks().forEach(t => t.stop()); return }

        video.srcObject = stream

        const onMeta = () => {
          if (cancelled) return
          video.play()
            .then(() => { if (!cancelled) setState({ ready: true, error: null }) })
            .catch(err => { if (!cancelled) setState({ ready: false, error: (err as Error).message }) })
        }

        video.addEventListener('loadedmetadata', onMeta, { once: true })

        // Fallback: if metadata already loaded
        if (video.readyState >= 1) {
          onMeta()
        }
      })
      .catch(err => {
        if (!cancelled) setState({ ready: false, error: (err as Error).message })
      })

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, [])

  return { videoRef, ...state }
}
