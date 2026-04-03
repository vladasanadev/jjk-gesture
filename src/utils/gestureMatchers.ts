import type { TrackedHand, GestureResult } from '../types/gestures'
import {
  isExtended, isCurled, indexPointingUp, middleCrossesIndex,
  middleNotFullyExtended, isOpenPalm, twoHandAlignment,
} from './fingerState'

/** Score the Gojo one-hand crossed/interlaced two-finger gesture.
 *  Returns 0–1. Only considers the first hand when multiple detected. */
export function matchGojoCrossedFingers(hands: TrackedHand[]): GestureResult {
  // Prefer single-hand context; pick the hand with the higher raw index-extended signal
  const hand = hands[0]
  if (!hand) return { id: 'gojo_crossed_fingers', score: 0 }

  const lm = hand.landmarks
  let score = 0

  // Index extended upward
  if (indexPointingUp(lm) && isExtended(lm, 1)) score += 0.35

  // Middle tip very close to index tip (crossed/interlaced)
  if (middleCrossesIndex(lm)) score += 0.30

  // Ring and pinky curled
  if (isCurled(lm, 3)) score += 0.15
  if (isCurled(lm, 4)) score += 0.15

  // ── Penalties ────────────────────────────────────────────────────────────
  // Penalty: middle fully extended upward (peace sign)
  if (isExtended(lm, 2) && !middleNotFullyExtended(lm)) score -= 0.30

  // Penalty: all fingers open (open palm)
  if (isOpenPalm(lm)) score -= 0.40

  // Mild penalty if second hand also visible (this is a 1-hand gesture)
  if (hands.length > 1) score -= 0.20

  return { id: 'gojo_crossed_fingers', score: Math.max(0, Math.min(1, score)) }
}

/** Score the Sukuna two-hand interlaced seal gesture.
 *  Returns 0–1. Hard gate: requires exactly 2 hands. */
export function matchSukunaTwoHandSeal(hands: TrackedHand[]): GestureResult {
  if (hands.length < 2) return { id: 'sukuna_two_hand_seal', score: 0 }

  const [a, b] = hands
  let score = 0

  const lmA = a.landmarks
  const lmB = b.landmarks

  // Both index fingers extended upward
  if (indexPointingUp(lmA) && isExtended(lmA, 1)) score += 0.15
  if (indexPointingUp(lmB) && isExtended(lmB, 1)) score += 0.15

  // Two-hand proximity and alignment
  const { score: alignScore, aligned } = twoHandAlignment(a, b)
  score += alignScore * 0.50

  // Other fingers mostly curled on both hands
  const fingersA = [2, 3, 4] as const
  const fingersB = [2, 3, 4] as const
  const curlA = fingersA.filter(f => isCurled(lmA, f)).length
  const curlB = fingersB.filter(f => isCurled(lmB, f)).length
  score += ((curlA + curlB) / 6) * 0.20

  // ── Penalties ────────────────────────────────────────────────────────────
  if (!aligned) score -= 0.30

  return { id: 'sukuna_two_hand_seal', score: Math.max(0, Math.min(1, score)) }
}
