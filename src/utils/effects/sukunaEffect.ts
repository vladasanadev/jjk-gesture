import { Container, Graphics } from 'pixi.js'
import { BaseEffect } from './baseEffect'
import { ParticleSystem } from './particles'
import { buildSukunaSeal } from './sigils'
import { applyScreenOverlay, applyFlash } from './screenFx'
import type { EffectAnchors } from '../effectAnchors'
import { SUKUNA_C, SIGIL_CFG, EFFECT_TIMING, EFFECT_QUALITY, PARTICLE_COUNTS } from '../effectConfig'

function easeOut(t: number) { return 1 - (1 - t) * (1 - t) }
function clamp01(x: number) { return Math.max(0, Math.min(1, x)) }
function subT(p: number, start: number, end: number) {
  return clamp01((p - start) / (end - start))
}

type Pt = { x: number; y: number }

export class SukunaEffect extends BaseEffect {
  private readonly vignetteGfx: Graphics
  private readonly tendrilsGfx:  Graphics   // gathering energy lines, ADD
  private readonly sealContainer: Container // rotating seal geometry, ADD
  private readonly slashGfx:     Graphics   // angular slash lines, ADD
  private readonly centerGfx:    Graphics   // violent center pulse, ADD
  private readonly flashGfx:     Graphics   // screen flash at peak, NORMAL
  private readonly particles:    ParticleSystem
  private readonly sw: number
  private readonly sh: number
  private lastSpawnP = 0
  private shakeX = 0
  private shakeY = 0

  constructor(stageW: number, stageH: number) {
    super()
    this.duration = EFFECT_TIMING.sukuna.total
    this.sw = stageW
    this.sh = stageH

    this.vignetteGfx = new Graphics()

    this.tendrilsGfx = new Graphics()
    this.tendrilsGfx.blendMode = 'add'

    this.sealContainer = new Container()
    this.sealContainer.blendMode = 'add'
    this.sealContainer.alpha = 0
    this.sealContainer.addChild(buildSukunaSeal())

    this.slashGfx = new Graphics()
    this.slashGfx.blendMode = 'add'

    this.centerGfx = new Graphics()
    this.centerGfx.blendMode = 'add'

    this.flashGfx = new Graphics()

    this.particles = new ParticleSystem()

    // Layer order: vignette → tendrils → seal → slashes → center → particles → flash
    this.root.addChild(
      this.vignetteGfx,
      this.tendrilsGfx,
      this.sealContainer,
      this.slashGfx,
      this.centerGfx,
      this.particles.container,
      this.flashGfx,
    )
  }

  protected onPlay(_anchors: EffectAnchors): void {
    this.particles.clear()
    this.lastSpawnP = 0
    this.sealContainer.alpha = 0
    this.shakeX = 0
    this.shakeY = 0
  }

  protected onTick(progress: number, dtMs: number, anchors: EffectAnchors): void {
    const mid  = anchors.handsMidpoint ?? anchors.palmCenter ?? { x: this.sw / 2, y: this.sh / 2 }
    const tipA = anchors.indexTipA ?? mid
    const tipB = anchors.indexTipB ?? mid

    const p1 = EFFECT_TIMING.sukuna.phase1End
    const p2 = EFFECT_TIMING.sukuna.phase2End

    // Global fade envelope
    const masterAlpha =
      progress < 0.07 ? progress / 0.07 :
      progress > 0.90 ? (1 - progress) / 0.10 : 1
    this.root.alpha = masterAlpha

    // ── Phase 1: dark energy gathers between hands ─────────────────────────
    const t1 = subT(progress, 0, p1)
    this.drawTendrils(tipA, tipB, mid, easeOut(t1))

    // Screen darkens early
    const darkAlpha = clamp01(t1 * 0.55)
    applyScreenOverlay(this.vignetteGfx, this.sw, this.sh, SUKUNA_C.darkest, darkAlpha)

    // ── Phase 2: seal + slashes ────────────────────────────────────────────
    const t2 = subT(progress, p1, p2)
    if (t2 > 0) {
      this.sealContainer.position.set(mid.x, mid.y)
      this.sealContainer.alpha = clamp01(t2 * 2.5) * 0.88
      this.sealContainer.rotation += (SIGIL_CFG.sukuna.rotSpeed * dtMs) / 1000

      this.drawSlashes(mid, easeOut(t2))
    }

    // ── Phase 3: violent center burst ─────────────────────────────────────
    const t3 = subT(progress, p2, 1)
    if (t3 > 0) {
      this.drawCenterBurst(mid, t3)

      // Screen shake
      if (EFFECT_QUALITY !== 'low') {
        const shakeIntensity = easeOut(t3) * (1 - t3) * 10
        this.shakeX = (Math.random() - 0.5) * shakeIntensity
        this.shakeY = (Math.random() - 0.5) * shakeIntensity
        this.root.position.set(this.shakeX, this.shakeY)
      }

      // Flash near peak
      if (t3 > 0.65) {
        applyFlash(this.flashGfx, this.sw, this.sh, (1 - t3) * 1.4)
      }

      // Deepen vignette
      applyScreenOverlay(this.vignetteGfx, this.sw, this.sh, SUKUNA_C.darkest, 0.55 + easeOut(t3) * 0.25)
    }

    // ── Particles ─────────────────────────────────────────────────────────
    if (progress > p1 * 0.3) {
      const pCount   = PARTICLE_COUNTS['sukuna'][EFFECT_QUALITY]
      const interval = 1 / (pCount * 1.4)
      if (progress - this.lastSpawnP > interval) {
        this.lastSpawnP = progress
        this.spawnParticles(tipA, tipB, mid)
      }
    }
    this.particles.update(dtMs)
  }

  // ── Drawing helpers ──────────────────────────────────────────────────────────

  private drawTendrils(tipA: Pt, tipB: Pt, mid: Pt, t: number): void {
    const g = this.tendrilsGfx
    g.clear()
    if (t <= 0) return

    // Main energy line connecting both index tips
    g.moveTo(tipA.x, tipA.y)
    g.lineTo(tipB.x, tipB.y)
    g.stroke({ color: SUKUNA_C.crimson, width: 10, alpha: 0.12 * t })

    g.moveTo(tipA.x, tipA.y)
    g.lineTo(tipB.x, tipB.y)
    g.stroke({ color: SUKUNA_C.red, width: 3, alpha: 0.55 * t })

    g.moveTo(tipA.x, tipA.y)
    g.lineTo(tipB.x, tipB.y)
    g.stroke({ color: SUKUNA_C.bright, width: 1, alpha: 0.85 * t })

    // Secondary lines: tips toward midpoint
    if (EFFECT_QUALITY !== 'low') {
      const lines: [Pt, Pt][] = [[tipA, mid], [tipB, mid]]
      for (const [from, to] of lines) {
        // interpolate toward mid based on t
        const ex = from.x + (to.x - from.x) * t
        const ey = from.y + (to.y - from.y) * t
        g.moveTo(from.x, from.y); g.lineTo(ex, ey)
        g.stroke({ color: SUKUNA_C.secondary, width: 4, alpha: 0.18 * t })
        g.moveTo(from.x, from.y); g.lineTo(ex, ey)
        g.stroke({ color: SUKUNA_C.bright, width: 1, alpha: 0.60 * t })
      }
    }
  }

  private drawSlashes(mid: Pt, t: number): void {
    const g = this.slashGfx
    g.clear()
    if (t <= 0) return

    const angles = [
      -Math.PI / 5,
       Math.PI / 5,
       Math.PI * 3/5,
      -Math.PI * 3/5,
    ]
    const slashCount = EFFECT_QUALITY === 'low' ? 2 : angles.length

    for (let i = 0; i < slashCount; i++) {
      const a   = angles[i]
      const len = 60 + i * 15
      const x1  = mid.x + Math.cos(a) * -len * t
      const y1  = mid.y + Math.sin(a) * -len * t
      const x2  = mid.x + Math.cos(a) *  len * t
      const y2  = mid.y + Math.sin(a) *  len * t

      g.moveTo(x1, y1); g.lineTo(x2, y2)
      g.stroke({ color: SUKUNA_C.crimson, width: 8, alpha: 0.10 * t })
      g.moveTo(x1, y1); g.lineTo(x2, y2)
      g.stroke({ color: SUKUNA_C.red, width: 2, alpha: 0.55 * t })
      g.moveTo(x1, y1); g.lineTo(x2, y2)
      g.stroke({ color: SUKUNA_C.bright, width: 0.8, alpha: 0.80 * t })
    }
  }

  private drawCenterBurst(mid: Pt, t: number): void {
    const g    = this.centerGfx
    const beat = 0.82 + 0.18 * Math.sin(this.elapsed / 80)
    g.clear()

    // Expanding ring pulses
    for (let i = 0; i < 2; i++) {
      const delay = i * 0.22
      const rt    = clamp01((t - delay) / (1 - delay))
      if (rt <= 0) continue
      const r     = 18 + rt * 100
      const alpha = (1 - rt) * 0.90

      g.circle(mid.x, mid.y, r)
      g.stroke({ color: SUKUNA_C.crimson, width: Math.max(0.5, 3 - rt * 2.5), alpha })
      g.circle(mid.x, mid.y, r + 6)
      g.stroke({ color: SUKUNA_C.deep, width: 8, alpha: alpha * 0.20 })
    }

    // Central glow core
    const layers = [
      { r: 52 * beat, color: SUKUNA_C.primary,   a: 0.10 },
      { r: 34 * beat, color: SUKUNA_C.secondary,  a: 0.22 },
      { r: 20 * beat, color: SUKUNA_C.crimson,    a: 0.40 },
      { r: 10 * beat, color: SUKUNA_C.red,        a: 0.60 },
      { r:  5 * beat, color: SUKUNA_C.bright,     a: 0.85 },
    ]
    for (const l of layers) {
      g.circle(mid.x, mid.y, l.r)
      g.fill({ color: l.color, alpha: l.a * easeOut(t) })
    }
  }

  private spawnParticles(tipA: Pt, tipB: Pt, mid: Pt): void {
    const count = EFFECT_QUALITY === 'low' ? 1 : EFFECT_QUALITY === 'medium' ? 2 : 3

    // Particles converge toward mid from both tips
    for (const tip of [tipA, tipB]) {
      this.particles.spawn({
        x: tip.x + (Math.random() - 0.5) * 40,
        y: tip.y + (Math.random() - 0.5) * 40,
        count, color: SUKUNA_C.crimson,
        speed: 1.2, minSize: 1.5, maxSize: 3, minLife: 25, maxLife: 55,
        inward: true, tx: mid.x, ty: mid.y,
      })
    }

    // Outward sparks from center
    if (Math.random() > 0.55) {
      this.particles.spawn({
        x: mid.x, y: mid.y,
        count: 1, color: SUKUNA_C.bright,
        speed: 2.2, minSize: 1, maxSize: 2, minLife: 20, maxLife: 40,
      })
    }
  }

  protected onStop(): void {
    this.particles.clear()
    this.tendrilsGfx.clear()
    this.slashGfx.clear()
    this.centerGfx.clear()
    this.vignetteGfx.clear()
    this.flashGfx.clear()
    this.sealContainer.alpha = 0
    this.root.position.set(0, 0)
  }

  override destroy(): void {
    this.particles.destroy()
    this.root.destroy({ children: true })
  }
}
