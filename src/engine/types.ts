import type { TTargetName } from '~/const'
import type { GifObject } from '~/utils/gif'

export type TAction = 'run' | 'stay' | 'jump' | 'path' | 'scene' | 'return' | null

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

export type TCaught = {
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
  action: TAction
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
  caught: TCaught
}

export type TCat = {
  source: GifObject
  jumpHeight: number
  jumpStage: number
  trajectoryDirection: number
  CatX: number
  CatY: number
  atPosition: boolean
}
