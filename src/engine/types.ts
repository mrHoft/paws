import type { TTargetName } from '../const'
import type { TGifObject } from './resource'

export type Action = 'run' | 'stay' | 'jump' | 'path' | 'scene' | 'return' | null

export type Target = {
  nameCurr: TTargetName
  nameLast: TTargetName
  xCurr: number
  yCurr: number
  PositionX: number
  xLast: number
  yLast: number
  heightCurr: number
  heightLast: number
  isBarrier: boolean
  runAwayDelay: number
  atPosition: boolean
}

export type TCatched = {
  butterfly: number
  grasshopper: number
  frog: number
  bird: number
  mouse: number
}

export type TGame = {
  SPEED: number
  successHeightModifier: number
  updateTime: number
  action: Action
  ctx: CanvasRenderingContext2D | null
  definingTrajectory: boolean
  timer: number
  movementSpeed: number
  runAwaySpeed: number
  successHeight: number
  success: boolean
  fullJump: boolean
  paused: boolean
  combo: number
  score: number
  catched: TCatched
}

export type TCat = {
  source: TGifObject
  jumpHeight: number
  jumpStage: number
  trajectoryDirection: number
  CatX: number
  CatY: number
  atPosition: boolean
}
