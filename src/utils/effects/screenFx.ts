import { Graphics } from 'pixi.js'

/**
 * Draw a simple full-screen dim / vignette overlay.
 * Clears the Graphics object then fills it with the given colour + alpha.
 * Kept simple (solid rect) for performance; the ADD-blend glow elements
 * provide the cinematic rim naturally.
 */
export function applyScreenOverlay(
  g: Graphics,
  w: number,
  h: number,
  color: number,
  alpha: number,
): void {
  g.clear()
  if (alpha <= 0) return
  g.rect(0, 0, w, h)
  g.fill({ color, alpha })
}

/**
 * Apply a brief flash — bright white fill that fades out quickly.
 * Call once at the peak of the effect (progress ≈ 0.9).
 */
export function applyFlash(
  g: Graphics,
  w: number,
  h: number,
  intensity: number,   // 0–1
): void {
  g.clear()
  if (intensity <= 0) return
  g.rect(0, 0, w, h)
  g.fill({ color: 0xffffff, alpha: intensity * 0.18 })
}
