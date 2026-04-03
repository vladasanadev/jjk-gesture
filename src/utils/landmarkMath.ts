import type { NormalizedLandmark, HandLandmarks } from '../types/gestures'

// MediaPipe hand landmark indices
export const LM = {
  WRIST: 0,
  THUMB_CMC: 1, THUMB_MCP: 2, THUMB_IP: 3, THUMB_TIP: 4,
  INDEX_MCP: 5, INDEX_PIP: 6, INDEX_DIP: 7, INDEX_TIP: 8,
  MIDDLE_MCP: 9, MIDDLE_PIP: 10, MIDDLE_DIP: 11, MIDDLE_TIP: 12,
  RING_MCP: 13, RING_PIP: 14, RING_DIP: 15, RING_TIP: 16,
  PINKY_MCP: 17, PINKY_PIP: 18, PINKY_DIP: 19, PINKY_TIP: 20,
} as const

export function dist2D(a: NormalizedLandmark, b: NormalizedLandmark): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

/** Approximate palm size as wrist→middle_mcp distance (used for scale-normalisation) */
export function handScale(lm: HandLandmarks): number {
  return Math.max(dist2D(lm[LM.WRIST], lm[LM.MIDDLE_MCP]), 0.001)
}

/** Geometric center of the palm (average of MCP joints + wrist) */
export function palmCenter(lm: HandLandmarks): NormalizedLandmark {
  const pts = [lm[LM.WRIST], lm[LM.INDEX_MCP], lm[LM.MIDDLE_MCP], lm[LM.RING_MCP], lm[LM.PINKY_MCP]]
  let x = 0, y = 0, z = 0
  for (const p of pts) { x += p.x; y += p.y; z += p.z }
  return { x: x / pts.length, y: y / pts.length, z: z / pts.length }
}

/** Midpoint between two landmarks */
export function midpoint(a: NormalizedLandmark, b: NormalizedLandmark): NormalizedLandmark {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 }
}

/** 2D unit vector from a → b */
export function fingerVector(from: NormalizedLandmark, to: NormalizedLandmark): [number, number] {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.sqrt(dx * dx + dy * dy) || 0.0001
  return [dx / len, dy / len]
}

/** Dot product of two 2D unit vectors → cosine of angle */
export function dotVec([ax, ay]: [number, number], [bx, by]: [number, number]): number {
  return ax * bx + ay * by
}

/** Angle (degrees) at joint `b` formed by points a-b-c */
export function angleBetween(a: NormalizedLandmark, b: NormalizedLandmark, c: NormalizedLandmark): number {
  const v1 = fingerVector(b, a)
  const v2 = fingerVector(b, c)
  const cosA = Math.max(-1, Math.min(1, dotVec(v1, v2)))
  return (Math.acos(cosA) * 180) / Math.PI
}

/** Scale-normalised distance between two landmarks */
export function normDist(a: NormalizedLandmark, b: NormalizedLandmark, scale: number): number {
  return dist2D(a, b) / scale
}
