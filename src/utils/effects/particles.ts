import { Container, Graphics } from 'pixi.js'

interface Particle {
  x: number; y: number
  vx: number; vy: number
  life: number; maxLife: number
  size: number; color: number; baseAlpha: number
}

export interface SpawnOpts {
  x: number; y: number
  count: number; color: number
  speed?: number
  minSize?: number; maxSize?: number
  minLife?: number; maxLife?: number
  /** Pull toward (tx, ty) */
  inward?: boolean; tx?: number; ty?: number
  /** Lock spawn direction */
  dirAngle?: number; dirSpread?: number
}

export class ParticleSystem {
  private readonly particles: Particle[] = []
  private readonly gfx: Graphics
  readonly container: Container

  constructor() {
    this.container = new Container()
    this.gfx       = new Graphics()
    this.gfx.blendMode = 'add'
    this.container.addChild(this.gfx)
  }

  spawn(o: SpawnOpts): void {
    for (let i = 0; i < o.count; i++) {
      const baseAngle = o.dirAngle !== undefined
        ? o.dirAngle + (Math.random() - 0.5) * (o.dirSpread ?? Math.PI * 2)
        : Math.random() * Math.PI * 2
      const spd = (o.speed ?? 1.2) * (0.4 + Math.random() * 0.8)
      let vx = Math.cos(baseAngle) * spd
      let vy = Math.sin(baseAngle) * spd

      if (o.inward && o.tx !== undefined && o.ty !== undefined) {
        const dx = o.tx - o.x, dy = o.ty - o.y
        const len = Math.hypot(dx, dy) || 1
        vx = vx * 0.4 + (dx / len) * spd * 0.7
        vy = vy * 0.4 + (dy / len) * spd * 0.7
      }

      const minL = o.minLife ?? 35, maxL = o.maxLife ?? 70
      this.particles.push({
        x: o.x, y: o.y, vx, vy,
        life: 0,
        maxLife: minL + Math.random() * (maxL - minL),
        size: (o.minSize ?? 2) + Math.random() * ((o.maxSize ?? 4) - (o.minSize ?? 2)),
        color: o.color,
        baseAlpha: 0.65 + Math.random() * 0.35,
      })
    }
  }

  update(dtMs: number): void {
    this.gfx.clear()
    const dt = dtMs / 16.667   // normalise to 60 fps units

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.life += dt
      if (p.life >= p.maxLife) { this.particles.splice(i, 1); continue }

      p.x  += p.vx * dt;  p.y  += p.vy * dt
      p.vx *= 0.97;        p.vy *= 0.97        // gentle drag

      const t     = p.life / p.maxLife
      const alpha = p.baseAlpha * (t < 0.25 ? t / 0.25 : 1 - (t - 0.25) / 0.75)
      const r     = Math.max(0.5, p.size * (1 - t * 0.5))

      this.gfx.circle(p.x, p.y, r)
      this.gfx.fill({ color: p.color, alpha: Math.max(0, alpha) })
    }
  }

  clear(): void { this.particles.length = 0; this.gfx.clear() }

  destroy(): void { this.container.destroy({ children: true }) }
}
