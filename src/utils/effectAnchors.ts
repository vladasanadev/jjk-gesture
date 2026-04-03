import type { TrackedHand, NormalizedLandmark } from '../types/gestures'
import { LM, palmCenter as getPalmCenter } from './landmarkMath'

export interface EffectAnchors {
  // Primary / first hand
  palmCenter:   { x: number; y: number } | null
  wrist:        { x: number; y: number } | null
  indexTip:     { x: number; y: number } | null
  indexDip:     { x: number; y: number } | null
  indexPip:     { x: number; y: number } | null
  indexMcp:     { x: number; y: number } | null
  middleTip:    { x: number; y: number } | null
  middleDip:    { x: number; y: number } | null
  middlePip:    { x: number; y: number } | null
  middleMcp:    { x: number; y: number } | null
  fingerCenter: { x: number; y: number } | null  // midpoint index+middle tips
  // Two-hand
  palmCenterA:   { x: number; y: number } | null
  palmCenterB:   { x: number; y: number } | null
  wristA:        { x: number; y: number } | null
  wristB:        { x: number; y: number } | null
  indexTipA:     { x: number; y: number } | null
  indexTipB:     { x: number; y: number } | null
  handsMidpoint: { x: number; y: number } | null
  // Stage size
  stageW: number
  stageH: number
}

function lm2px(pt: NormalizedLandmark, w: number, h: number) {
  return { x: pt.x * w, y: pt.y * h }
}

const BLANK: Omit<EffectAnchors, 'stageW' | 'stageH'> = {
  palmCenter: null, wrist: null,
  indexTip: null, indexDip: null, indexPip: null, indexMcp: null,
  middleTip: null, middleDip: null, middlePip: null, middleMcp: null,
  fingerCenter: null,
  palmCenterA: null, palmCenterB: null,
  wristA: null, wristB: null,
  indexTipA: null, indexTipB: null,
  handsMidpoint: null,
}

export function computeEffectAnchors(
  hands: TrackedHand[],
  stageW: number,
  stageH: number,
): EffectAnchors {
  const w = stageW, h = stageH
  if (!hands.length) return { ...BLANK, stageW, stageH }

  const lmA = hands[0].landmarks
  const pcA  = getPalmCenter(lmA)
  const itA  = lmA[LM.INDEX_TIP]
  const mtA  = lmA[LM.MIDDLE_TIP]

  const result: EffectAnchors = {
    ...BLANK,
    stageW, stageH,
    palmCenter:   lm2px(pcA, w, h),
    wrist:        lm2px(lmA[LM.WRIST], w, h),
    indexTip:     lm2px(itA, w, h),
    indexDip:     lm2px(lmA[LM.INDEX_DIP], w, h),
    indexPip:     lm2px(lmA[LM.INDEX_PIP], w, h),
    indexMcp:     lm2px(lmA[LM.INDEX_MCP], w, h),
    middleTip:    lm2px(mtA, w, h),
    middleDip:    lm2px(lmA[LM.MIDDLE_DIP], w, h),
    middlePip:    lm2px(lmA[LM.MIDDLE_PIP], w, h),
    middleMcp:    lm2px(lmA[LM.MIDDLE_MCP], w, h),
    fingerCenter: { x: (itA.x + mtA.x) / 2 * w, y: (itA.y + mtA.y) / 2 * h },
    palmCenterA:  lm2px(pcA, w, h),
    wristA:       lm2px(lmA[LM.WRIST], w, h),
    indexTipA:    lm2px(itA, w, h),
  }

  if (hands.length >= 2) {
    const lmB = hands[1].landmarks
    const pcB  = getPalmCenter(lmB)
    const itB  = lmB[LM.INDEX_TIP]
    result.palmCenterB  = lm2px(pcB, w, h)
    result.wristB       = lm2px(lmB[LM.WRIST], w, h)
    result.indexTipB    = lm2px(itB, w, h)
    result.handsMidpoint = {
      x: (pcA.x + pcB.x) / 2 * w,
      y: (pcA.y + pcB.y) / 2 * h,
    }
  }

  return result
}
