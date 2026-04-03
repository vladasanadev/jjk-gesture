import { useEffect } from 'react'

interface Props {
  videoRef: React.RefObject<HTMLVideoElement>
  canvasRef: React.RefObject<HTMLCanvasElement>
  ready: boolean
}

export function CameraView({ videoRef, canvasRef, ready }: Props) {
  // Keep canvas dimensions in sync with video size
  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    function syncSize() {
      if (!video || !canvas) return
      canvas.width = video.videoWidth || video.clientWidth
      canvas.height = video.videoHeight || video.clientHeight
    }

    video.addEventListener('loadedmetadata', syncSize)
    const ro = new ResizeObserver(syncSize)
    ro.observe(video)
    syncSize()

    return () => {
      video.removeEventListener('loadedmetadata', syncSize)
      ro.disconnect()
    }
  }, [videoRef, canvasRef])

  return (
    <div className="camera-stage">
      {!ready && (
        <div className="camera-placeholder">
          <p>Requesting camera…</p>
        </div>
      )}
      <video
        ref={videoRef}
        className="camera-video"
        autoPlay
        playsInline
        muted
        style={{ transform: 'scaleX(-1)' }}
      />
      <canvas ref={canvasRef} className="camera-canvas" style={{ transform: 'scaleX(-1)' }} />
    </div>
  )
}
