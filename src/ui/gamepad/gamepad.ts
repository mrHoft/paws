import { type TSceneName } from "~/const"
import { buttonClose } from "~/ui/button"
import { Localization } from '~/service/localization'
import { GamepadService } from "~/service/gamepad"

import styles from './gamepad.module.css'

class GamepadView {
  protected loc: Localization
  protected container: HTMLDivElement
  protected inner: HTMLDivElement
  protected gamepads: HTMLDivElement[] = []

  constructor() {
    this.loc = new Localization()
    this.container = document.createElement('div')
    this.container.className = styles.gamepad_layer
    this.container.setAttribute('style', 'display: none;')

    this.inner = document.createElement('div')
    this.inner.className = styles.gamepad__inner

    const header = document.createElement('h3')
    this.loc.register('twoPlayers', header)

    const message = document.createElement('p')
    this.loc.register('connectGamepad', message)

    const gamepads = document.createElement('div')
    gamepads.className = styles.gamepad__row
    for (let i = 0; i < 2; i += 1) {
      const gamepad = document.createElement('div')
      gamepad.className = styles.gamepad__icon
      gamepads.append(gamepad)
      this.gamepads.push(gamepad)
    }

    const btnClose = buttonClose()
    btnClose.addEventListener('click', () => {
      this.container.setAttribute('style', 'display: none;')
    })

    this.inner.append(header, message, gamepads, btnClose)
    this.container.append(this.inner)
  }

  public show = (state = true) => {
    this.container.setAttribute('style', `display: ${state ? 'flex' : 'none'};`)
    this.inner.classList.toggle(styles.bounce, state)
  }

  protected setGamepadActive = (index: number) => {
    const el = this.gamepads[index - 1]
    if (el) {
      el.classList.add(styles.active)
    }
  }

  public get element() {
    return this.container
  }
}

export class GamepadUI extends GamepadView {
  // private startGame: (levelName: TSceneName, restart?: boolean) => void
  private gamepadService: GamepadService

  constructor({ /* start */ }: { start: (levelName: TSceneName, restart?: boolean) => void }) {
    super()
    // this.startGame = start
    this.gamepadService = new GamepadService({
      onGamepadConnected: this.handleGamepadConnected,
      onGamepadDisconnected: this.handleGamepadConnected
    })

    this.container.addEventListener('click', event => {
      const { target, currentTarget } = event;
      if (target === currentTarget) {
        event.preventDefault();
        this.show(false)
      }
    })
  }

  private handleGamepadConnected = () => {
    const total = this.gamepadService.gamepadCount
    this.setGamepadActive(Math.min(total, 2))
  }
}
