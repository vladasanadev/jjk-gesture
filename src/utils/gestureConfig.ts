// ─── Central tuning file ────────────────────────────────────────────────────
// Adjust gesture thresholds, timing, and effect colors here.

export const GESTURE_CONFIG = {
  // ── Detection ──────────────────────────────────────────────────────────────
  scoreThreshold: 0.60,
  stableFramesRequired: 8,
  lostFramesTolerance: 3,
  cooldownMs: 6000,

  /** How long (ms) the charge effect holds before the tab opens — 3.5 s */
  chargeDurationMs: 3500,

  // ── Geometry helpers ───────────────────────────────────────────────────────
  crossProximityThreshold: 0.08,
  twoHandMaxWristDist: 0.55,
  sealIndexTipMaxDist: 0.12,

  // ── Gojo effect colors — vivid purple ─────────────────────────────────────
  gojo: {
    primary: '#c084fc',
    secondary: '#e879f9',
    glow: 'rgba(192,132,252,0.85)',
    particle: '#f0abfc',
    vignette: 'rgba(88,28,135,0.55)',
    innerGlow: 'rgba(233,121,249,0.95)',
  },

  // ── Sukuna effect colors — vivid crimson ───────────────────────────────────
  sukuna: {
    primary: '#f87171',
    secondary: '#fca5a5',
    glow: 'rgba(248,113,113,0.90)',
    particle: '#fecaca',
    vignette: 'rgba(127,29,29,0.60)',
    innerGlow: 'rgba(252,165,165,0.95)',
  },

  // ── Effect timing ──────────────────────────────────────────────────────────
  effectFadeIn: 0.08,    // fast fade-in (8% of 3.5 s = 0.28 s)
  effectFadeOut: 0.10,   // quick fade-out at the very end

  particleCount: 28,
  particleRadius: 90,
} as const
