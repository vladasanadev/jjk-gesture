import { Container } from 'pixi.js'
import type { EffectAnchors } from '../effectAnchors'

export abstract class BaseEffect {
  readonly root: Container
  protected elapsed  = 0
  protected duration = 650   // ms — override in subclass
  protected active   = false
  private _onComplete: (() => void) | null = null

  constructor() {
    this.root = new Container()
    this.root.visible = false
  }

  play(anchors: EffectAnchors, onComplete: () => void): void {
    this.elapsed     = 0
    this.active      = true
    this._onComplete = onComplete
    this.root.visible = true
    this.onPlay(anchors)
  }

  /** Call every frame from the Pixi ticker. */
  tick(dtMs: number, anchors: EffectAnchors): void {
    if (!this.active) return
    this.elapsed += dtMs
    const progress = Math.min(this.elapsed / this.duration, 1)
    this.onTick(progress, dtMs, anchors)
    if (progress >= 1) this.finish()
  }

  stop(): void {
    this.active       = false
    this.root.visible = false
    this._onComplete  = null
    this.onStop()
  }

  destroy(): void {
    this.stop()
    this.root.destroy({ children: true })
  }

  get isActive(): boolean { return this.active }

  private finish(): void {
    this.active       = false
    this.root.visible = false
    const cb = this._onComplete
    this._onComplete  = null
    this.onStop()
    cb?.()
  }

  protected abstract onPlay(anchors: EffectAnchors): void
  protected abstract onTick(progress: number, dtMs: number, anchors: EffectAnchors): void
  protected abstract onStop(): void
}
