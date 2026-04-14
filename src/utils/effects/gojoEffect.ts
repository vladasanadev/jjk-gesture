import { Container, Graphics } from 'pixi.js'
import { BaseEffect } from './baseEffect'
import { ParticleSystem } from './particles'
import { buildGojoSigil } from './sigils'
import { applyScreenOverlay } from './screenFx'
import type { EffectAnchors } from '../effectAnchors'
import { GOJO_C, SIGIL_CFG, EFFECT_TIMING, EFFECT_QUALITY, PARTICLE_COUNTS } from '../effectConfig'

// ── Helpers ───────────────────────────────────────────────────────────────────
function easeOut(t: number) { return 1 - (1 - t) * (1 - t) }
function clamp01(x: number) { return Math.max(0, Math.min(1, x)) }
function subT(p: number, start: number, end: number) {
  return clamp01((p - start) / (end - start))
}

type Pt = { x: number; y: number }

// ─────────────────────────────────────────────────────────────────────────────
export class GojoEffect extends BaseEffect {
  private readonly vignetteGfx:  Graphics   // screen dim, normal blend
  private readonly auraGfx:      Graphics   // soft glow, ADD
  private readonly sigilOuter:   Container  // CW rotating ring
  private readonly sigilInner:   Container  // CCW rotating ring
  private readonly tracesGfx:    Graphics   // finger energy traces, ADD
  private readonly crossGlowGfx: Graphics   // concentrated glow at cross, ADD
  private readonly ringBurstGfx: Graphics   // expanding ring burst, ADD
  private readonly particles:    ParticleSystem
  private readonly sw: number
  private readonly sh: number
  private lastSpawnP = 0

  constructor(stageW: number, stageH: number) {
    super()
    this.duration = EFFECT_TIMING.gojo.total
    this.sw = stageW
    this.sh = stageH

    // Vignette — behind everything, normal blend
    this.vignetteGfx = new Graphics()

    // Aura — ADD blend for light emission
    this.auraGfx = new Graphics()
    this.auraGfx.blendMode = 'add'

    // Sigil: two independently rotating containers
    this.sigilOuter = new Container()
    this.sigilOuter.blendMode = 'add'
    this.sigilOuter.alpha = 0

    this.sigilInner = new Container()
    this.sigilInner.blendMode = 'add'
    this.sigilInner.alpha = 0

    const { outer, inner } = buildGojoSigil()
    this.sigilOuter.addChild(outer)
    this.sigilInner.addChild(inner)

    // Traces — ADD
    this.tracesGfx = new Graphics()
    this.tracesGfx.blendMode = 'add'

    // Cross glow — ADD
    this.crossGlowGfx = new Graphics()
    this.crossGlowGfx.blendMode = 'add'

    // Ring burst — ADD
    this.ringBurstGfx = new Graphics()
    this.ringBurstGfx.blendMode = 'add'

    // Particles
    this.particles = new ParticleSystem()

    // Layer order: vignette (back) → aura → sigil → traces → cross → burst → particles (front)
    this.root.addChild(
      this.vignetteGfx,
      this.auraGfx,
      this.sigilOuter,
      this.sigilInner,
      this.ringBurstGfx,
      this.tracesGfx,
      this.crossGlowGfx,
      this.particles.container,
    )
  }

  protected onPlay(_anchors: EffectAnchors): void {
    this.particles.clear()
    this.lastSpawnP    = 0
    this.sigilOuter.alpha = 0
    this.sigilInner.alpha = 0
  }

  protected onTick(progress: number, dtMs: number, anchors: EffectAnchors): void {
    const pc = anchors.palmCenter   ?? { x: this.sw / 2, y: this.sh / 2 }
    const fc = anchors.fingerCenter ?? pc
    const p1 = EFFECT_TIMING.gojo.phase1End
    const p2 = EFFECT_TIMING.gojo.phase2End

    // Global alpha envelope: fast fade-in, late fade-out
    const masterAlpha =
      progress < 0.07 ? progress / 0.07 :
      progress > 0.88 ? (1 - progress) / 0.12 : 1
    this.root.alpha = masterAlpha

    // ── Phase 1: finger traces ─────────────────────────────────────────────
    this.drawFingerTraces(anchors, easeOut(subT(progress, 0, p1)))

    // ── Phase 2: sigil + aura ──────────────────────────────────────────────
    const t2 = subT(progress, p1, p2)
    if (t2 > 0) {
      this.sigilOuter.position.set(pc.x, pc.y)
      this.sigilInner.position.set(pc.x, pc.y)
      this.sigilOuter.alpha = clamp01(t2 * 2) * 0.78
      this.sigilInner.alpha = clamp01((t2 - 0.2) * 3) * 0.68
      const rot = dtMs / 1000
      this.sigilOuter.rotation +=  SIGIL_CFG.gojo.rotSpeed    * rot
      this.sigilInner.rotation -=  SIGIL_CFG.gojo.counterSpeed * rot
      this.drawAura(pc, t2)
    }

    // Cross glow (starts halfway through p1)
    this.drawCrossGlow(fc, clamp01(subT(progress, p1 * 0.5, p2)))

    // ── Phase 3: ring burst + screen dim ──────────────────────────────────
    const t3 = subT(progress, p2, 1)
    if (t3 > 0) {
      this.drawRingBurst(pc, t3)
      applyScreenOverlay(this.vignetteGfx, anchors.stageW, anchors.stageH, GOJO_C.deep, easeOut(t3) * 0.25)
    }

    // ── Particles: spawn from mid p1 onward ──────────────────────────────
    if (progress > p1 * 0.5) {
      const pCount   = PARTICLE_COUNTS['gojo'][EFFECT_QUALITY]
      const interval = 1 / (pCount * 1.2)
      if (progress - this.lastSpawnP > interval) {
        this.lastSpawnP = progress
        this.spawnParticles(fc, pc)
      }
    }
    this.particles.update(dtMs)
  }

  // ── Drawing helpers ─────────────────────────────────────────────────────────

  private drawFingerTraces(anchors: EffectAnchors, t: number): void {
    this.tracesGfx.clear()
    if (t <= 0) return

    type MaybePt = { x: number; y: number } | null
    const filterPts = (pts: MaybePt[]): Pt[] =>
      pts.filter((p): p is Pt => p !== null)

    const indexPath  = filterPts([anchors.indexMcp,  anchors.indexPip,  anchors.indexDip,  anchors.indexTip])
    const middlePath = filterPts([anchors.middleMcp, anchors.middlePip, anchors.middleDip, anchors.middleTip])

    this.drawTracePath(indexPath,  t,        GOJO_C.glow,     GOJO_C.white)
    this.drawTracePath(middlePath, t * 0.85, GOJO_C.lavender, GOJO_C.pale)
  }

  private drawTracePath(pts: Pt[], t: number, color: number, bright: number): void {
    const g = this.tracesGfx
    if (pts.length < 2) return
    const segs = pts.length - 1

    for (let i = 0; i < segs; i++) {
      const segT = clamp01(t * segs - i)
      if (segT <= 0) continue
      const from = pts[i], to = pts[i + 1]
      const ex = from.x + (to.x - from.x) * segT
      const ey = from.y + (to.y - from.y) * segT

      // Outer glow
      g.moveTo(from.x, from.y); g.lineTo(ex, ey)
      g.stroke({ color, width: 8, alpha: 0.20 })
      // Mid
      g.moveTo(from.x, from.y); g.lineTo(ex, ey)
      g.stroke({ color, width: 3, alpha: 0.65 })
      // Bright core
      g.moveTo(from.x, from.y); g.lineTo(ex, ey)
      g.stroke({ color: bright, width: 1.2, alpha: 0.95 })
    }
  }

  private drawAura(pc: Pt, t: number): void {
    const g    = this.auraGfx
    const beat = 0.88 + 0.12 * Math.sin(this.elapsed / 120)
    g.clear()
    const layers: { r: number; color: number; a: number }[] = [
      { r: 88 * beat, color: GOJO_C.primary,   a: 0.07 },
      { r: 62 * beat, color: GOJO_C.secondary,  a: 0.14 },
      { r: 42 * beat, color: GOJO_C.glow,       a: 0.24 },
      { r: 26 * beat, color: GOJO_C.lavender,   a: 0.38 },
      { r: 14 * beat, color: GOJO_C.white,      a: 0.52 },
    ]
    for (const l of layers) {
      g.circle(pc.x, pc.y, l.r)
      g.fill({ color: l.color, alpha: l.a * t })
    }
  }

  private drawCrossGlow(fc: Pt, t: number): void {
    const g    = this.crossGlowGfx
    const beat = 0.85 + 0.15 * Math.sin(this.elapsed / 100)
    g.clear()
    if (t <= 0) return
    const layers: { r: number; color: number; a: number }[] = [
      { r: 48, color: GOJO_C.primary,   a: 0.10 },
      { r: 30, color: GOJO_C.secondary, a: 0.28 },
      { r: 17, color: GOJO_C.lavender,  a: 0.52 },
      { r:  8, color: GOJO_C.white,     a: 0.78 },
    ]
    for (const l of layers) {
      g.circle(fc.x, fc.y, l.r * beat)
      g.fill({ color: l.color, alpha: l.a * t })
    }
  }

  private drawRingBurst(pc: Pt, t: number): void {
    const g = this.ringBurstGfx
    g.clear()
    for (let i = 0; i < 2; i++) {
      const delay = i * 0.18
      const rt    = clamp01((t - delay) / (1 - delay))
      if (rt <= 0) continue
      const r     = 28 + rt * 115
      const alpha = (1 - rt) * 0.82
      g.circle(pc.x, pc.y, r)
      g.stroke({ color: GOJO_C.glow,    width: Math.max(0.5, 2.5 - rt * 2), alpha })
      g.circle(pc.x, pc.y, r + 7)
      g.stroke({ color: GOJO_C.primary, width: 6,                             alpha: alpha * 0.18 })
    }
  }

  private spawnParticles(fc: Pt, pc: Pt): void {
    const count = EFFECT_QUALITY === 'low' ? 1 : EFFECT_QUALITY === 'medium' ? 2 : 3

    // Inward drift toward finger cross centre
    this.particles.spawn({
      x: fc.x + (Math.random() - 0.5) * 85,
      y: fc.y + (Math.random() - 0.5) * 85,
      count, color: GOJO_C.lavender,
      speed: 0.9, minSize: 1.5, maxSize: 3.5, minLife: 30, maxLife: 65,
      inward: true, tx: fc.x, ty: fc.y,
    })

    // Outward drift from palm
    if (Math.random() > 0.6) {
      this.particles.spawn({
        x: pc.x, y: pc.y,
        count: 1, color: GOJO_C.pale,
        speed: 1.6, minSize: 1, maxSize: 2.5, minLife: 25, maxLife: 50,
      })
    }
  }

  protected onStop(): void {
    this.particles.clear()
    this.tracesGfx.clear()
    this.crossGlowGfx.clear()
    this.auraGfx.clear()
    this.ringBurstGfx.clear()
    this.vignetteGfx.clear()
    this.sigilOuter.alpha = 0
    this.sigilInner.alpha = 0
  }

  override destroy(): void {
    this.particles.destroy()
    this.root.destroy({ children: true })
  }
}
