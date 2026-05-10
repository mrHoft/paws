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
  private game: Element
  private gamepadService: GamepadService
  private controls: Partial<Record<TControl, EngineData>> = {}

  constructor() {
    this.gamepadService = inject(GamepadService)
    const element = document.querySelector('.game')
    if (!element) throw Error('Game container was not found!')
    this.game = element!
    this.registerEvents()
  }

  public registerControl = (control: TControl, data: EngineData) => {
    this.controls[control] = data
  }

  public unregisterControls = () => {
    this.controls = {}
  }

  private canJump = (engine: EngineData): boolean => {
    return !engine.game.definingTrajectory && engine.game.action !== 'jump'
  }

  private handlers = {
    keydown: (event: KeyboardEvent) => {
      for (const control of controlType.keyboard) {
        const engine = this.controls[control]
        if (engine) {
          if (this.canJump(engine) && event.code == 'Space') {
            engine.prepareJumpStart()
          }
        }
      }
    },
    keyup: (event: KeyboardEvent) => {
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
    },
    pointerdown: (event: Event) => {
      if (!(event.target instanceof HTMLCanvasElement)) return
      event.preventDefault()

      for (const control of controlType.pointer) {
        const engine = this.controls[control]
        if (engine) {
          if (this.canJump(engine)) {
            engine.prepareJumpStart()
          }
        }
      }
    },
    pointerup: () => {
      for (const control of controlType.pointer) {
        const engine = this.controls[control]
        if (engine) {
          if (engine.game.definingTrajectory) {
            engine.prepareJumpEnd()
          }
        }
      }
    },
    touchstart: (event: Event) => event.preventDefault(),
    gamepadButtonDown: (gamepadIndex: number, buttonIndex: number) => {
      const gamepad = `gamepad${gamepadIndex + 1}`
      for (const control of [gamepad, 'any'] as TControl[]) {
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
    },
    gamepadButtonUp: (gamepadIndex: number, buttonIndex: number) => {
      const gamepad = `gamepad${gamepadIndex + 1}`
      for (const control of [gamepad, 'any'] as TControl[]) {
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
  }

  private registerEvents = () => {
    window.addEventListener('keydown', this.handlers.keydown)
    window.addEventListener('keyup', this.handlers.keyup)
    this.game.addEventListener('pointerdown', this.handlers.pointerdown)
    this.game.addEventListener('pointerup', this.handlers.pointerup)
    this.game.addEventListener('pointercancel', this.handlers.pointerup)
    this.gamepadService.registerCallbacks({ onButtonDown: this.handlers.gamepadButtonDown, onButtonUp: this.handlers.gamepadButtonUp })

    if ('ontouchstart' in window) {
      this.game.addEventListener('touchstart', this.handlers.touchstart, { passive: false, capture: true })
    }
  }

  public dispose = () => {
    window.removeEventListener('keydown', this.handlers.keydown)
    window.removeEventListener('keyup', this.handlers.keyup)
    this.game.removeEventListener('pointerdown', this.handlers.pointerdown)
    this.game.removeEventListener('pointerup', this.handlers.pointerup)
    this.game.removeEventListener('pointercancel', this.handlers.pointerup)
    this.gamepadService.unRegisterCallbacks({ onButtonDown: this.handlers.gamepadButtonDown, onButtonUp: this.handlers.gamepadButtonUp })

    if ('ontouchstart' in window) {
      this.game.removeEventListener('touchstart', this.handlers.touchstart)
    }
  }
}
