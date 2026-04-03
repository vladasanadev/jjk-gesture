import type { GestureId } from './gestures'

export type SkillAction = 'pr_review' | 'threat_model'

export interface ActionConfig {
  gesture: GestureId
  action: SkillAction
  demoRoute: string
  verdentEnvKey: string
  label: string
}
