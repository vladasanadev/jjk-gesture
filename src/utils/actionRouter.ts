import type { GestureId } from '../types/gestures'

const PROJECT = import.meta.env.VITE_PROJECT_NAME ?? 'jjk-gesture-skill-router'
const REPO    = import.meta.env.VITE_REPO_NAME ?? 'jjk-gesture'
const AUTO_OPEN = import.meta.env.VITE_AUTO_OPEN_VERDENT === 'true'
const PR_URL   = import.meta.env.VITE_VERDENT_PR_REVIEW_URL ?? ''
const TM_URL   = import.meta.env.VITE_VERDENT_THREAT_MODEL_URL ?? ''

const BASE = window.location.origin

export function triggerSkillAction(gesture: GestureId): void {
  const ts = Date.now()
  const qs = `project=${encodeURIComponent(PROJECT)}&repo=${encodeURIComponent(REPO)}&gesture=${gesture}&ts=${ts}`

  if (gesture === 'gojo_crossed_fingers') {
    // Open internal mock PR Review demo
    window.open(`${BASE}/demo/pr-review?${qs}`, '_blank')
    // Also open external Verdent PR Review skill if configured
    if (AUTO_OPEN && PR_URL) window.open(PR_URL, '_blank')
  } else {
    // Open internal mock Threat Model demo
    window.open(`${BASE}/demo/threat-model?${qs}`, '_blank')
    // Also open external Verdent Threat Model skill if configured
    if (AUTO_OPEN && TM_URL) window.open(TM_URL, '_blank')
  }
}
