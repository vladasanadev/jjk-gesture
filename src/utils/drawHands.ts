import type { HandLandmarks } from '../types/gestures'

// MediaPipe hand connections (pairs of landmark indices)
const HAND_CONNECTIONS: [number, number][] = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [5,9],[9,10],[10,11],[11,12],
  [9,13],[13,14],[14,15],[15,16],
  [13,17],[0,17],[17,18],[18,19],[19,20],
]

export function drawHandSkeleton(
  ctx: CanvasRenderingContext2D,
  lm: HandLandmarks,
  w: number,
  h: number,
  color = 'rgba(255,255,255,0.75)',
): void {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 2

  for (const [a, b] of HAND_CONNECTIONS) {
    ctx.beginPath()
    ctx.moveTo(lm[a].x * w, lm[a].y * h)
    ctx.lineTo(lm[b].x * w, lm[b].y * h)
    ctx.stroke()
  }

  // Draw landmark dots
  for (const pt of lm) {
    ctx.beginPath()
    ctx.arc(pt.x * w, pt.y * h, 3, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.fill()
  }
  ctx.restore()
}
