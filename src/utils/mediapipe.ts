import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

let _handLandmarker: HandLandmarker | null = null
let _initPromise: Promise<HandLandmarker> | null = null

export async function getHandLandmarker(): Promise<HandLandmarker> {
  if (_handLandmarker) return _handLandmarker
  if (_initPromise) return _initPromise

  _initPromise = (async () => {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
    )
    _handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 2,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    })
    return _handLandmarker
  })()

  return _initPromise
}
