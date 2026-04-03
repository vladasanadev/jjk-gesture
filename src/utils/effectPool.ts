import { Graphics } from 'pixi.js'

/** Simple pool to reuse Graphics objects and avoid GC pressure. */
export class GraphicsPool {
  private readonly pool: Graphics[] = []
  private readonly cap: number

  constructor(cap = 60) { this.cap = cap }

  get(): Graphics {
    const g = this.pool.pop() ?? new Graphics()
    g.visible  = true
    g.alpha    = 1
    g.rotation = 0
    g.scale.set(1)
    g.position.set(0, 0)
    return g
  }

  release(g: Graphics): void {
    if (this.pool.length >= this.cap) { g.destroy(); return }
    g.clear()
    g.visible  = false
    g.alpha    = 1
    g.rotation = 0
    g.scale.set(1)
    g.position.set(0, 0)
    this.pool.push(g)
  }

  drain(): void {
    this.pool.forEach(g => g.destroy())
    this.pool.length = 0
  }
}
