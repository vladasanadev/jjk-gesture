export type GestureId = 'gojo_crossed_fingers' | 'sukuna_two_hand_seal'

export interface NormalizedLandmark {
  x: number
  y: number
  z: number
}

export type HandLandmarks = NormalizedLandmark[]

export interface TrackedHand {
  landmarks: HandLandmarks
  handedness: 'Left' | 'Right'
}

export interface HandTrackingResult {
  hands: TrackedHand[]
  timestamp: number
}

export interface GestureResult {
  id: GestureId
  score: number
}
