import type { HandLandmarks, NormalizedLandmark, TrackedHand } from '../types/gestures'
import { LM, dist2D, handScale, palmCenter, fingerVector } from './landmarkMath'
import { GESTURE_CONFIG } from './gestureConfig'

/** Returns true if a finger (index 0-4 = thumb..pinky) tip is above its MCP (extended up).
 *  Uses raw y coords: smaller y = higher on screen. */
export function isExtended(lm: HandLandmarks, fingerId: 0 | 1 | 2 | 3 | 4): boolean {
  const tips  = [LM.THUMB_TIP,  LM.INDEX_TIP,  LM.MIDDLE_TIP,  LM.RING_TIP,  LM.PINKY_TIP]  as const
  const pips  = [LM.THUMB_IP,   LM.INDEX_PIP,  LM.MIDDLE_PIP,  LM.RING_PIP,  LM.PINKY_PIP]  as const
  const mcps  = [LM.THUMB_MCP,  LM.INDEX_MCP,  LM.MIDDLE_MCP,  LM.RING_MCP,  LM.PINKY_MCP]  as const
  const tip = lm[tips[fingerId]]
  const pip = lm[pips[fingerId]]
  const mcp = lm[mcps[fingerId]]
  // tip is above pip which is above mcp → extended
  return tip.y < pip.y && pip.y < mcp.y
}

/** Returns true if the finger is clearly curled (tip significantly below PIP). */
export function isCurled(lm: HandLandmarks, fingerId: 1 | 2 | 3 | 4): boolean {
  const tips  = [LM.INDEX_TIP,  LM.MIDDLE_TIP,  LM.RING_TIP,  LM.PINKY_TIP]  as const
  const pips  = [LM.INDEX_PIP,  LM.MIDDLE_PIP,  LM.RING_PIP,  LM.PINKY_PIP]  as const
  const mcps  = [LM.INDEX_MCP,  LM.MIDDLE_MCP,  LM.RING_MCP,  LM.PINKY_MCP]  as const
  const idx = fingerId - 1
  const tip = lm[tips[idx]]
  const mcp = lm[mcps[idx]]
  // Suppress unused-variable warning for pips — kept for clarity
  void pips
  const scale = handScale(lm)
  // Tip is closer to palm than PIP, scaled
  return dist2D(tip, mcp) / scale < 0.7
}

/** Returns true if index finger is pointing generally upward (y vector negative = up on screen) */
export function indexPointingUp(lm: HandLandmarks): boolean {
  const [, dy] = fingerVector(lm[LM.INDEX_MCP], lm[LM.INDEX_TIP])
  return dy < -0.5  // pointing at least 60° upward
}

/** Normalised distance between middle tip and index tip (scale = hand size) */
export function middleIndexProximity(lm: HandLandmarks): number {
  const scale = handScale(lm)
  return dist2D(lm[LM.MIDDLE_TIP], lm[LM.INDEX_TIP]) / scale
}

/** Returns true if middle finger is crossing or very close to index (Gojo gesture) */
export function middleCrossesIndex(lm: HandLandmarks): boolean {
  const prox = middleIndexProximity(lm)
  return prox < GESTURE_CONFIG.crossProximityThreshold * 8  // normalised proximity < 0.64
}

/** Returns true if both index tips are close together (two-hand seal) */
export function indexTipsClose(handA: HandLandmarks, handB: HandLandmarks): boolean {
  return dist2D(handA[LM.INDEX_TIP], handB[LM.INDEX_TIP]) < GESTURE_CONFIG.sealIndexTipMaxDist
}

/** Returns true if both wrists are within allowed distance (hands together) */
export function wristsClose(handA: HandLandmarks, handB: HandLandmarks): boolean {
  return dist2D(handA[LM.WRIST], handB[LM.WRIST]) < GESTURE_CONFIG.twoHandMaxWristDist
}

/** Checks if two hands are roughly horizontally aligned (y difference small) */
export function handsHorizontallyAligned(handA: HandLandmarks, handB: HandLandmarks): boolean {
  const centerA = palmCenter(handA)
  const centerB = palmCenter(handB)
  const dy = Math.abs(centerA.y - centerB.y)
  return dy < 0.25
}

/** Average y-symmetry score between two hands' finger tips (0=perfect, 1=totally asymmetric) */
export function handSymmetryScore(handA: HandLandmarks, handB: HandLandmarks): number {
  const tipsA: NormalizedLandmark[] = [handA[LM.INDEX_TIP], handA[LM.MIDDLE_TIP], handA[LM.RING_TIP], handA[LM.PINKY_TIP]]
  const tipsB: NormalizedLandmark[] = [handB[LM.INDEX_TIP], handB[LM.MIDDLE_TIP], handB[LM.RING_TIP], handB[LM.PINKY_TIP]]
  let diff = 0
  for (let i = 0; i < 4; i++) {
    diff += Math.abs(tipsA[i].y - tipsB[i].y)
  }
  return diff / 4  // 0 = symmetric
}

/** True if middle finger tip is clearly NOT above its PIP (i.e. not fully extended high) */
export function middleNotFullyExtended(lm: HandLandmarks): boolean {
  return lm[LM.MIDDLE_TIP].y > lm[LM.MIDDLE_PIP].y - 0.02
}

/** True if all four main fingers are extended (open palm – penalise) */
export function isOpenPalm(lm: HandLandmarks): boolean {
  return (
    isExtended(lm, 1) && isExtended(lm, 2) && isExtended(lm, 3) && isExtended(lm, 4)
  )
}

/** Checks two-hand alignment for Sukuna seal */
export function twoHandAlignment(a: TrackedHand, b: TrackedHand): { aligned: boolean; score: number } {
  const close = indexTipsClose(a.landmarks, b.landmarks)
  const wClose = wristsClose(a.landmarks, b.landmarks)
  const hAlign = handsHorizontallyAligned(a.landmarks, b.landmarks)
  const symm = handSymmetryScore(a.landmarks, b.landmarks)

  const score = (close ? 0.4 : 0) + (wClose ? 0.2 : 0) + (hAlign ? 0.2 : 0) + Math.max(0, 0.2 - symm)
  return { aligned: close && wClose, score }
}
