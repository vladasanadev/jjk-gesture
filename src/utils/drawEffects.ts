import type { TrackedHand, NormalizedLandmark } from '../types/gestures'
import { LM, palmCenter, midpoint } from './landmarkMath'
import { GESTURE_CONFIG } from './gestureConfig'

function px(pt: NormalizedLandmark, w: number, h: number): [number, number] {
  return [pt.x * w, pt.y * h]
}

function easeAlpha(progress: number): number {
  const fi = GESTURE_CONFIG.effectFadeIn
  const fo = GESTURE_CONFIG.effectFadeOut
  if (progress < fi) return progress / fi
  if (progress > 1 - fo) return (1 - progress) / fo
  return 1
}

function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 43758.5453
  return x - Math.floor(x)
}

/** Bright neon "beam" line between two points */
function neonLine(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  color: string,
  glowColor: string,
  width: number,
  alpha: number,
) {
  ctx.save()
  ctx.globalAlpha = alpha
  // Outer glow pass
  ctx.shadowColor = glowColor
  ctx.shadowBlur = 40
  ctx.strokeStyle = glowColor
  ctx.lineWidth = width * 4
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
  // Mid glow
  ctx.shadowBlur = 20
  ctx.strokeStyle = color
  ctx.lineWidth = width * 2
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
  // Core bright white center
  ctx.shadowBlur = 8
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = width * 0.6
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
  ctx.restore()
}

/** Glowing halo circle */
function neonCircle(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  color: string, glowColor: string, alpha: number,
) {
  ctx.save()
  ctx.globalAlpha = alpha
  // Radial glow fill
  const g = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r)
  g.addColorStop(0, glowColor)
  g.addColorStop(0.5, color.replace(')', ',0.5)').replace('rgb', 'rgba'))
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()
  // Bright ring
  ctx.shadowColor = glowColor; ctx.shadowBlur = 30
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.globalAlpha = alpha * 0.9
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.7, 0, Math.PI * 2); ctx.stroke()
  ctx.restore()
}

export function drawGojoEffect(
  ctx: CanvasRenderingContext2D,
  hands: TrackedHand[],
  progress: number,
  w: number,
  h: number,
): void {
  if (!hands[0]) return
  const lm = hands[0].landmarks
  const alpha = easeAlpha(progress)
  const cfg = GESTURE_CONFIG.gojo

  // Pulsing beat (3 pulses per second over the hold)
  const beat = 0.85 + 0.15 * Math.sin(progress * Math.PI * 2 * 9)

  const center = palmCenter(lm)
  const [cx, cy] = px(center, w, h)
  const [ix, iy] = px(lm[LM.INDEX_TIP], w, h)
  const [mx, my] = px(lm[LM.MIDDLE_TIP], w, h)
  const [wx, wy] = px(lm[LM.WRIST], w, h)

  // ── Wide screen vignette (goes on first, behind everything) ───────────────
  ctx.save()
  const vGrad = ctx.createRadialGradient(w / 2, h / 2, h * 0.1, w / 2, h / 2, h * 0.9)
  vGrad.addColorStop(0, 'rgba(0,0,0,0)')
  vGrad.addColorStop(1, cfg.vignette)
  ctx.globalAlpha = alpha * beat
  ctx.fillStyle = vGrad
  ctx.fillRect(0, 0, w, h)
  ctx.restore()

  // ── Expanding aura rings from wrist → palm ────────────────────────────────
  for (let i = 0; i < 3; i++) {
    const phase = ((progress * 4) + i / 3) % 1
    const r = (80 + i * 35) * (0.5 + phase * 0.5)
    neonCircle(ctx, cx, cy, r * beat, cfg.primary, cfg.glow, alpha * (1 - phase) * 0.8)
  }

  // ── Palm → wrist energy column ────────────────────────────────────────────
  neonLine(ctx, cx, cy, wx, wy, cfg.primary, cfg.glow, 3, alpha * beat * 0.7)

  // ── Crossed-finger core glow ──────────────────────────────────────────────
  const fingerMidX = (ix + mx) / 2
  const fingerMidY = (iy + my) / 2
  neonCircle(ctx, fingerMidX, fingerMidY, 40 * beat, cfg.secondary, cfg.innerGlow, alpha)

  // ── Neon lines around index + middle (rotating spokes) ───────────────────
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + progress * Math.PI * 6
    const r1 = 14, r2 = (30 + progress * 40) * beat
    neonLine(
      ctx,
      ix + Math.cos(angle) * r1, iy + Math.sin(angle) * r1,
      ix + Math.cos(angle) * r2, iy + Math.sin(angle) * r2,
      cfg.primary, cfg.glow, 2, alpha * 0.95,
    )
    const a2 = angle + 0.4
    neonLine(
      ctx,
      mx + Math.cos(a2) * r1, my + Math.sin(a2) * r1,
      mx + Math.cos(a2) * r2, my + Math.sin(a2) * r2,
      cfg.secondary, cfg.innerGlow, 2, alpha * 0.9,
    )
  }

  // ── Bright cross-beam between fingertips ──────────────────────────────────
  neonLine(ctx, ix, iy, mx, my, cfg.secondary, cfg.innerGlow, 4, alpha * beat)

  // ── Drifting particles ────────────────────────────────────────────────────
  const pCount = GESTURE_CONFIG.particleCount
  for (let i = 0; i < pCount; i++) {
    const seed = i * 17
    const angle = seededRand(seed) * Math.PI * 2 + progress * 2
    const r = seededRand(seed + 1) * GESTURE_CONFIG.particleRadius
    const drift = progress * 60
    const life = seededRand(seed + 2)
    const ppx = fingerMidX + Math.cos(angle) * r + Math.cos(angle + 1) * drift
    const ppy = fingerMidY + Math.sin(angle) * r + Math.sin(angle + 1) * drift
    const size = 2 + seededRand(seed + 3) * 4
    ctx.save()
    ctx.shadowColor = cfg.innerGlow; ctx.shadowBlur = 12
    ctx.beginPath(); ctx.arc(ppx, ppy, size, 0, Math.PI * 2)
    ctx.fillStyle = cfg.particle
    ctx.globalAlpha = alpha * life * beat
    ctx.fill()
    ctx.restore()
  }
}

export function drawSukunaEffect(
  ctx: CanvasRenderingContext2D,
  hands: TrackedHand[],
  progress: number,
  w: number,
  h: number,
): void {
  if (hands.length < 2) return
  const [a, b] = hands
  const alpha = easeAlpha(progress)
  const cfg = GESTURE_CONFIG.sukuna

  const beat = 0.85 + 0.15 * Math.sin(progress * Math.PI * 2 * 9)

  const itA = a.landmarks[LM.INDEX_TIP]
  const itB = b.landmarks[LM.INDEX_TIP]
  const [ax, ay] = px(itA, w, h)
  const [bx, by] = px(itB, w, h)
  const mid = midpoint(itA, itB)
  const [midX, midY] = px(mid, w, h)
  const cA = palmCenter(a.landmarks)
  const cB = palmCenter(b.landmarks)
  const [caX, caY] = px(cA, w, h)
  const [cbX, cbY] = px(cB, w, h)

  // ── Vignette ──────────────────────────────────────────────────────────────
  ctx.save()
  const vGrad = ctx.createRadialGradient(w / 2, h / 2, h * 0.1, w / 2, h / 2, h * 0.9)
  vGrad.addColorStop(0, 'rgba(0,0,0,0)')
  vGrad.addColorStop(1, cfg.vignette)
  ctx.globalAlpha = alpha * beat
  ctx.fillStyle = vGrad
  ctx.fillRect(0, 0, w, h)
  ctx.restore()

  // ── Palm aura rings ───────────────────────────────────────────────────────
  for (let i = 0; i < 3; i++) {
    const phase = ((progress * 4) + i / 3) % 1
    const r = (70 + i * 30) * (0.5 + phase * 0.5)
    neonCircle(ctx, caX, caY, r * beat, cfg.primary, cfg.glow, alpha * (1 - phase) * 0.7)
    neonCircle(ctx, cbX, cbY, r * beat, cfg.primary, cfg.glow, alpha * (1 - phase) * 0.7)
  }

  // ── Central energy beam between index tips ────────────────────────────────
  neonLine(ctx, ax, ay, bx, by, cfg.primary, cfg.glow, 4, alpha * beat)

  // ── Palm-to-palm channel ──────────────────────────────────────────────────
  neonLine(ctx, caX, caY, cbX, cbY, cfg.secondary, cfg.glow, 2, alpha * 0.6)

  // ── Central pulse at midpoint ─────────────────────────────────────────────
  const pulseR = (35 + Math.sin(progress * Math.PI * 14) * 18) * beat
  neonCircle(ctx, midX, midY, pulseR, cfg.secondary, cfg.innerGlow, alpha)
  // Bright core dot
  ctx.save()
  ctx.shadowColor = cfg.innerGlow; ctx.shadowBlur = 40; ctx.globalAlpha = alpha * beat
  ctx.fillStyle = '#ffffff'
  ctx.beginPath(); ctx.arc(midX, midY, 6, 0, Math.PI * 2); ctx.fill()
  ctx.restore()

  // ── Slash streaks radiating from mid ─────────────────────────────────────
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + progress * Math.PI * 3
    const r1 = 20, r2 = (55 + progress * 70) * beat
    neonLine(
      ctx,
      midX + Math.cos(angle) * r1, midY + Math.sin(angle) * r1,
      midX + Math.cos(angle) * r2, midY + Math.sin(angle) * r2,
      cfg.primary, cfg.glow, 2, alpha * 0.9,
    )
  }

  // ── Glow halos on each index tip ─────────────────────────────────────────
  neonCircle(ctx, ax, ay, 38 * beat, cfg.secondary, cfg.innerGlow, alpha)
  neonCircle(ctx, bx, by, 38 * beat, cfg.secondary, cfg.innerGlow, alpha)

  // ── Particles ─────────────────────────────────────────────────────────────
  const pCount = GESTURE_CONFIG.particleCount
  for (let i = 0; i < pCount; i++) {
    const seed = i * 13
    const angle = seededRand(seed) * Math.PI * 2 + progress * 1.5
    const r = seededRand(seed + 1) * GESTURE_CONFIG.particleRadius
    const drift = progress * 55
    const life = seededRand(seed + 2)
    const ppx = midX + Math.cos(angle) * r + Math.cos(angle) * drift
    const ppy = midY + Math.sin(angle) * r + Math.sin(angle) * drift
    const size = 2 + seededRand(seed + 3) * 4
    ctx.save()
    ctx.shadowColor = cfg.innerGlow; ctx.shadowBlur = 10
    ctx.beginPath(); ctx.arc(ppx, ppy, size, 0, Math.PI * 2)
    ctx.fillStyle = cfg.particle
    ctx.globalAlpha = alpha * life * beat
    ctx.fill()
    ctx.restore()
  }
}
