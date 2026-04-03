// ─── Central effect tuning file ───────────────────────────────────────────────
// Colors, timing, quality — change values here to customize everything.

export type QualityLevel = 'low' | 'medium' | 'high'
export let EFFECT_QUALITY: QualityLevel = 'medium'
export function setEffectQuality(q: QualityLevel) { EFFECT_QUALITY = q }

// Phase fractions (0–1) within each effect's total duration
export const EFFECT_TIMING = {
  gojo: {
    total:     650,   // ms
    phase1End: 0.23,  // 0–23 %: finger trace awakening
    phase2End: 0.62,  // 23–62 %: sigil + aura
    // phase3:  62–100 %: ring pulse + screen dim
  },
  sukuna: {
    total:     600,   // ms
    phase1End: 0.20,  // 0–20 %: tendrils gather
    phase2End: 0.57,  // 20–57 %: seal + slashes
    // phase3:  57–100 %: violent burst
  },
} as const

// ── Gojo palette — violet / white ─────────────────────────────────────────────
export const GOJO_C = {
  deep:      0x4c1d95, // violet-900
  primary:   0x7c3aed, // violet-600
  secondary: 0x9333ea, // violet-600 bright
  glow:      0xa855f7, // violet-500
  lavender:  0xc084fc, // violet-400
  pale:      0xe9d5ff, // violet-200
  white:     0xffffff,
  blueWhite: 0xe0e7ff, // indigo-100
} as const

// ── Sukuna palette — crimson / black-red ──────────────────────────────────────
export const SUKUNA_C = {
  darkest:   0x1c0000, // near-black red
  deep:      0x450a0a, // very dark red
  primary:   0x7f1d1d, // red-900
  secondary: 0x991b1b, // red-800
  crimson:   0xb91c1c, // red-700
  red:       0xdc2626, // red-600
  bright:    0xf87171, // red-400
  highlight: 0xfca5a5, // red-300
} as const

export const PARTICLE_COUNTS: Record<string, Record<QualityLevel, number>> = {
  gojo:   { low: 10, medium: 22, high: 40 },
  sukuna: { low: 8,  medium: 16, high: 30 },
}

export const SIGIL_CFG = {
  gojo: {
    outerR:       88,
    midR:         68,
    innerR:       50,
    ticks:        24,
    rotSpeed:     0.45,   // rad/s — outer ring CW
    counterSpeed: 0.65,   // rad/s — inner ring CCW
  },
  sukuna: {
    outerR:   78,
    innerR:   36,
    points:   8,          // star points on angular seal
    rotSpeed: 0.9,        // rad/s
  },
} as const
