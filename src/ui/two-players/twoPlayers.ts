import { type TSceneName } from "~/const"
import { buttonClose } from "~/ui/button"
import { Localization } from '~/service/localization'
import { GamepadService } from "~/service/gamepad"
import { Injectable, inject } from "~/utils/inject"

import styles from './twoPlayers.module.css'
import modal from '~/ui/modal.module.css'
import layer from '~/ui/layers.module.css'

class TwoPlayersView {
  protected loc: Localization
  protected container: HTMLDivElement
  protected inner: HTMLDivElement
  protected close: HTMLDivElement
  protected gamepads: HTMLDivElement[] = []
  protected isActive = false

  constructor() {
    this.loc = inject(Localization)
    this.container = document.createElement('div')
    this.container.classList.add(layer.two_players, modal.outer)
    this.container.setAttribute('style', 'display: none;')

    this.inner = document.createElement('div')
    this.inner.className = modal.inner

    const header = document.createElement('h3')
    this.loc.register('twoPlayers', header)

    const message = document.createElement('p')
    this.loc.register('connectGamepad', message)

    const gamepads = document.createElement('div')
    gamepads.className = styles.two_players__row
    for (let i = 0; i < 2; i += 1) {
      const player = document.createElement('div')
      player.className = styles.two_players__item
      const playerId = document.createElement('span')
      playerId.className = 'text-shadow'
      playerId.innerText = `P${i + 1}`
      player.append(playerId)
      gamepads.append(player)
      this.gamepads.push(player)
    }

    this.close = buttonClose()

    this.inner.append(header, message, gamepads, this.close)
    this.container.append(this.inner)
  }

  public show = (state = true) => {
    this.container.setAttribute('style', `display: ${state ? 'flex' : 'none'};`)
    this.inner.classList.toggle(modal.bounce, state)
    this.isActive = state
  }

  public hide = () => {
    this.show(false)
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

@Injectable
export class TwoPlayers extends TwoPlayersView {
  // private startGame: (options?: { sceneName: TSceneName, restart?: boolean }) => void
  private gamepadService: GamepadService
  private onClose?: () => void

  constructor({ /* start */ }: { start: (options?: { sceneName: TSceneName, restart?: boolean }) => void }) {
    super()
    // this.startGame = start
    this.gamepadService = inject(GamepadService)
    this.gamepadService.registerCallbacks({
      onGamepadConnected: this.handleGamepadConnected,
      onGamepadDisconnected: this.handleGamepadConnected,
      onButtonUp: this.onGamepadButtonUp
    })

    this.container.addEventListener('click', event => {
      const { target, currentTarget } = event;
      if (target === currentTarget) {
        event.preventDefault();
        this.show(false)
        if (this.onClose) this.onClose()
      }
    })

    this.close.addEventListener('click', () => {
      this.show(false)
      if (this.onClose) this.onClose()
    })
  }

  public registerCallback = ({ onClose }: { onClose: () => void }) => {
    this.onClose = onClose
  }

  private onGamepadButtonUp = (_gamepadIndex: number, buttonIndex: number) => {
    if (!this.isActive) return

    if (buttonIndex === 0) {
      this.show(false)
      if (this.onClose) this.onClose()
    }
  }

  private handleGamepadConnected = () => {
    const total = this.gamepadService.gamepadCount
    this.setGamepadActive(Math.min(total, 2))
  }
}
