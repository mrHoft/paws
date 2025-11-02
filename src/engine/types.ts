import type { TTargetName, TSceneName } from '~/const'
import type { GifObject } from '~/utils/gif'

export type TAction = 'run' | 'stay' | 'jump' | 'path' | 'scene' | 'return' | null

export type Target = {
  nameCurr: TTargetName
  nameLast: TTargetName
  xCurr: number
  yCurr: number
  positionX: number
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
  frog: number
  bird: number
  mouse: number
}

export type TGame = {
  sceneName: TSceneName
  level: number
  multiplayer?: 'top' | 'bottom'
  control: TControl
  successHeightModifier: number
  updateTime: number
  action: TAction
  ctx: CanvasRenderingContext2D | null
  fps: boolean
  definingTrajectory: boolean
  timer: number
  movementSpeed: number
  runAwaySpeed: number
  success: boolean
  fullJump: boolean
  jumpStep: number
  paused: boolean
  stopped: boolean
  combo: number
  score: number
  caught: TCaught
  prophecy: {
    total: number
    fails: number
    multiplied: number
    speed: number
  }
  progress: number
  timestamp: number
  rendered: boolean // Used for the renderCallback to call on first render
}

export type TCat = {
  source: GifObject
  jumpHeight: number
  jumpStage: number
  trajectoryDirection: number
  x: number
  y: number
  atPosition: boolean
}

export type TControl = 'pointer' | 'keyboard' | 'gamepad1' | 'gamepad2' | 'any'

export interface EngineOptions {
  sceneName?: TSceneName,
  initialScore?: number
  restart?: boolean,
  fps?: boolean,
  multiplayer?: 'top' | 'bottom',
  control?: TControl
}

export interface EngineHandlers {
  handlePause: (_state: boolean) => void,
  handleGameOver?: () => void,  // Disabled mechanic
  updateLevel: (_value: number) => void,
  updateCombo: (_value: number, _player?: 'top' | 'bottom') => void,
  updateScore: (_value: number, _player?: 'top' | 'bottom') => void,
  updateProgress: (_value: number, _player?: 'top' | 'bottom') => void,
  updateCaught: (_id: string) => void,
  showTooltip: (_id: string) => void,
  handleFinish?: (_result: { score: number, time: number, caught?: number, prophecy?: number, player?: 'top' | 'bottom' }) => void
  renderCallback?: () => void // Will be called on first render after start or each pause
}

export interface EngineSettings {
  set: (_settings: { fps?: boolean }) => void
}
