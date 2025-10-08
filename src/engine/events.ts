import type { TGame } from './types'
import { AdvancedShepardTone } from '~/utils/shepardTone'

export class ControlEvents {
  private game: TGame
  private prepareJumpStart: () => void
  private prepareJumpEnd: () => void
  private pause: (state: boolean) => void
  private static __instance: ControlEvents
  private tone!: AdvancedShepardTone

  constructor(game: TGame, prepareJumpStart: () => void, prepareJumpEnd: () => void, pause: (state: boolean) => void) {
    this.game = game
    this.prepareJumpStart = prepareJumpStart
    this.prepareJumpEnd = prepareJumpEnd
    this.pause = pause
    if (ControlEvents.__instance) return ControlEvents.__instance

    this.tone = new AdvancedShepardTone({
      baseFrequency: 220,
      numOscillators: 2,
      cycleDuration: 6.0,
      oscillatorType: 'sine',
      volume: 0.1,
      direction: 'ascending'
    });
  }

  private canJump = (): boolean => {
    return !this.game.definingTrajectory && this.game.action !== 'jump'
  }

  private onkeydown = (event: KeyboardEvent) => {
    if (this.canJump() && event.code == 'Space') {
      this.tone.start();
      this.prepareJumpStart()
    }
  }

  private onkeyup = (event: KeyboardEvent) => {
    if (this.game.definingTrajectory && event.code == 'Space') {
      this.tone.stop();
      this.prepareJumpEnd()
    }
    if (event.code == 'Escape') {
      this.pause(true)
    }
  }

  private touchstart = (event: MouseEvent | TouchEvent) => {
    event.preventDefault()
    if (event.target && event.target instanceof HTMLDivElement && event.target.ariaLabel) return
    if (this.canJump()) {
      this.tone.start();
      this.prepareJumpStart()
    }
  }

  private touchend = (/* event: MouseEvent | TouchEvent */) => {
    if (this.game.definingTrajectory) {
      this.tone.stop();
      this.prepareJumpEnd()
    }
  }

  public registerEvents = () => {
    window.addEventListener('keydown', this.onkeydown)
    window.addEventListener('keyup', this.onkeyup)
    window.addEventListener('touchstart', this.touchstart)
    window.addEventListener('touchend', this.touchend)
    window.addEventListener('mousedown', this.touchstart)
    window.addEventListener('mouseup', this.touchend)
  }

  public unRegisterEvents = () => {
    window.removeEventListener('keydown', this.onkeydown)
    window.removeEventListener('keyup', this.onkeyup)
    window.removeEventListener('touchstart', this.touchstart)
    window.removeEventListener('touchend', this.touchend)
    window.removeEventListener('mousedown', this.touchstart)
    window.removeEventListener('mouseup', this.touchend)
  }
}
