import type { TGame, TControl } from './types'
import { GamepadService } from '~/service/gamepad'
import { inject, Injectable } from '~/utils/inject'

const controlType: Record<'keyboard' | 'pointer' | 'gamepad', TControl[]> = {
  keyboard: ['keyboard', 'any'],
  pointer: ['pointer', 'any'],
  gamepad: ['gamepad1', 'gamepad2', 'any'],
}

interface EngineData {
  game: TGame,
  prepareJumpStart: () => void,
  prepareJumpEnd: () => void,
  pause: (state: boolean) => void
}

@Injectable
export class EventsService {
  private gamepadService: GamepadService
  private controls: Partial<Record<TControl, EngineData>> = {}

  constructor() {
    this.gamepadService = inject(GamepadService)
    this.registerEvents()
  }

  public registerControl = (control: TControl, data: EngineData) => {
    this.controls[control] = data
  }

  private canJump = (engine: EngineData): boolean => {
    return !engine.game.definingTrajectory && engine.game.action !== 'jump'
  }

  private onkeydown = (event: KeyboardEvent) => {
    for (const control of controlType.keyboard) {
      const engine = this.controls[control]
      if (engine) {
        if (this.canJump(engine) && event.code == 'Space') {
          engine.prepareJumpStart()
        }
      }
    }
  }

  private onkeyup = (event: KeyboardEvent) => {
    for (const control of controlType.keyboard) {
      const engine = this.controls[control]
      if (engine) {
        if (event.code == 'Escape') {
          engine.pause(true)
        }
        if (engine.game.definingTrajectory && (event.code == 'Space' || event.code == 'Escape')) {
          engine.prepareJumpEnd()
        }
      }
    }
  }

  private touchstart = (event: MouseEvent | TouchEvent) => {
    event.preventDefault()
    if (event.target && event.target instanceof HTMLDivElement && event.target.ariaLabel) return
    for (const control of controlType.pointer) {
      const engine = this.controls[control]
      if (engine) {
        if (this.canJump(engine)) {
          engine.prepareJumpStart()
        }
      }
    }
  }

  private touchend = (/* event: MouseEvent | TouchEvent */) => {
    for (const control of controlType.pointer) {
      const engine = this.controls[control]
      if (engine) {
        if (engine.game.definingTrajectory) {
          engine.prepareJumpEnd()
        }
      }
    }
  }

  private onGamepadButtonDown = (_gamepadIndex: number, buttonIndex: number, _value: number) => {
    for (const control of controlType.gamepad) {
      const engine = this.controls[control]
      if (engine) {
        if (buttonIndex === 9) {
          return
        }
        if (this.canJump(engine)) {
          engine.prepareJumpStart()
        }
      }
    }
  }

  private onGamepadButtonUp = (_gamepadIndex: number, buttonIndex: number) => {
    for (const control of controlType.gamepad) {
      const engine = this.controls[control]
      if (engine) {
        if (buttonIndex === 9) {
          engine.pause(true)
        }
        if (engine.game.definingTrajectory) {
          engine.prepareJumpEnd()
        }
      }
    }
  }

  private registerEvents = () => {
    window.addEventListener('keydown', this.onkeydown)
    window.addEventListener('keyup', this.onkeyup)
    window.addEventListener('touchstart', this.touchstart)
    window.addEventListener('touchend', this.touchend)
    window.addEventListener('mousedown', this.touchstart)
    window.addEventListener('mouseup', this.touchend)
    this.gamepadService.registerCallbacks({ onButtonDown: this.onGamepadButtonDown, onButtonUp: this.onGamepadButtonUp })
  }

  public dispose = () => {
    window.removeEventListener('keydown', this.onkeydown)
    window.removeEventListener('keyup', this.onkeyup)
    window.removeEventListener('touchstart', this.touchstart)
    window.removeEventListener('touchend', this.touchend)
    window.removeEventListener('mousedown', this.touchstart)
    window.removeEventListener('mouseup', this.touchend)
    this.gamepadService.unRegisterCallbacks({ onButtonDown: this.onGamepadButtonDown, onButtonUp: this.onGamepadButtonUp })
  }
}
