import { Graphics } from 'pixi.js'
import { GOJO_C, SUKUNA_C, SIGIL_CFG, EFFECT_QUALITY } from '../effectConfig'

/**
 * Draw the Gojo concentric-ring sigil centred at (0, 0).
 * Returns two Graphics objects: outer (rotates CW) and inner (rotates CCW).
 * Add each to a dedicated Container and rotate the Container every frame.
 */
export function buildGojoSigil(): { outer: Graphics; inner: Graphics } {
  const cfg     = SIGIL_CFG.gojo
  const c       = GOJO_C
  const quality = EFFECT_QUALITY

  // ── Outer container: ring + tick marks ───────────────────────────────────
  const outer = new Graphics()

  outer.circle(0, 0, cfg.outerR)
  outer.stroke({ color: c.glow, width: 1.5, alpha: 0.85 })

  const ticks = quality === 'low' ? 12 : cfg.ticks
  for (let i = 0; i < ticks; i++) {
    const a     = (i / ticks) * Math.PI * 2
    const major = i % (ticks / 4) === 0
    const r1    = cfg.outerR - (major ? 8 : 4)
    const r2    = cfg.outerR + (major ? 8 : 4)
    outer.moveTo(Math.cos(a) * r1, Math.sin(a) * r1)
    outer.lineTo(Math.cos(a) * r2, Math.sin(a) * r2)
    outer.stroke({ color: major ? c.white : c.lavender, width: major ? 1.5 : 0.7, alpha: major ? 0.95 : 0.45 })
  }

  // Mid ring
  outer.circle(0, 0, cfg.midR)
  outer.stroke({ color: c.lavender, width: 0.8, alpha: 0.40 })

  // 4 cardinal connector lines (inner ring → mid ring)
  if (quality !== 'low') {
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2
      outer.moveTo(Math.cos(a) * (cfg.innerR + 5), Math.sin(a) * (cfg.innerR + 5))
      outer.lineTo(Math.cos(a) * (cfg.midR  - 5), Math.sin(a) * (cfg.midR  - 5))
      outer.stroke({ color: c.white, width: 1, alpha: 0.55 })
    }
  }

  // ── Inner container: counter-rotates ─────────────────────────────────────
  const inner = new Graphics()

  inner.circle(0, 0, cfg.innerR)
  inner.stroke({ color: c.secondary, width: 1.2, alpha: 0.80 })

  const innerTicks = quality === 'low' ? 6 : 12
  for (let i = 0; i < innerTicks; i++) {
    const a  = (i / innerTicks) * Math.PI * 2 + Math.PI / innerTicks
    inner.moveTo(Math.cos(a) * (cfg.innerR - 3), Math.sin(a) * (cfg.innerR - 3))
    inner.lineTo(Math.cos(a) * (cfg.innerR + 3), Math.sin(a) * (cfg.innerR + 3))
    inner.stroke({ color: c.lavender, width: 0.8, alpha: 0.50 })
  }

  if (quality === 'high') {
    const cR = 10
    inner.moveTo(-cR, 0); inner.lineTo(cR, 0)
    inner.stroke({ color: c.white, width: 0.5, alpha: 0.30 })
    inner.moveTo(0, -cR); inner.lineTo(0, cR)
    inner.stroke({ color: c.white, width: 0.5, alpha: 0.30 })
  }

  return { outer, inner }
}

/**
 * Draw the Sukuna angular seal centred at (0, 0).
 * Add to a Container and rotate it each frame.
 */
export function buildSukunaSeal(): Graphics {
  const cfg     = SIGIL_CFG.sukuna
  const c       = SUKUNA_C
  const quality = EFFECT_QUALITY
  const g       = new Graphics()

  // Angular star (alternating long/short spokes)
  const pts: number[] = []
  for (let i = 0; i < cfg.points; i++) {
    const a = (i / cfg.points) * Math.PI * 2 - Math.PI / 2
    const r = i % 2 === 0 ? cfg.outerR : cfg.innerR * 1.4
    pts.push(Math.cos(a) * r, Math.sin(a) * r)
  }
  g.poly(pts, true)
  g.stroke({ color: c.crimson, width: 2, alpha: 0.85 })

  // Inner diamond
  const sq = cfg.innerR
  g.poly([0, -sq, sq, 0, 0, sq, -sq, 0], true)
  g.stroke({ color: c.red, width: 1.2, alpha: 0.65 })

  // Centre circle
  g.circle(0, 0, cfg.innerR * 0.35)
  g.fill({ color: c.crimson, alpha: 0.35 })
  g.circle(0, 0, cfg.innerR * 0.35)
  g.stroke({ color: c.bright, width: 2, alpha: 0.90 })

  // Corner accent dots on outer points
  for (let i = 0; i < cfg.points; i += 2) {
    const a = (i / cfg.points) * Math.PI * 2 - Math.PI / 2
    g.circle(Math.cos(a) * cfg.outerR, Math.sin(a) * cfg.outerR, 3)
    g.fill({ color: c.bright, alpha: 0.90 })
  }

  // Slash accent lines
  if (quality !== 'low') {
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI + Math.PI / 8
      const r = cfg.outerR * 0.85
      g.moveTo(Math.cos(a) * -r, Math.sin(a) * -r)
      g.lineTo(Math.cos(a) *  r, Math.sin(a) *  r)
      g.stroke({ color: c.secondary, width: 0.8, alpha: 0.30 })
    }
  }

  return g
}
