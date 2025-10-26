import { buttonCircle } from '~/ui/button/circle'
import { iconSrc } from "~/ui/icons"
import { Localization } from '~/service/localization'
import { ConfirmationModal } from '../confirmation/confirm'
import { GamepadService } from '~/service/gamepad'
import { inject } from '~/utils/inject'

import styles from './win.module.css'
import modal from '~/ui/modal.module.css'
import layer from '~/ui/layers.module.css'

class WinView {
  protected loc: Localization
  protected container: HTMLDivElement
  protected inner: HTMLDivElement
  protected button: { replay: HTMLDivElement, menu: HTMLDivElement }
  protected result: {
    winner: HTMLSpanElement,
    score: HTMLSpanElement,
    time: HTMLSpanElement,
  }
  protected isActive = false

  constructor() {
    this.loc = inject(Localization)

    this.container = document.createElement('div')
    this.container.classList.add(layer.win, styles.win)
    this.container.setAttribute('style', `display: none;`)

    this.inner = document.createElement('div')
    const h2 = document.createElement('h2')
    this.loc.register('win', h2)

    this.button = {
      replay: buttonCircle({ src: iconSrc.restart }),
      menu: buttonCircle({ src: iconSrc.menu })
    }

    const btns = document.createElement('div')
    btns.className = modal.btns
    btns.append(this.button.replay, this.button.menu)

    this.result = {
      winner: document.createElement('span'),
      score: document.createElement('span'),
      time: document.createElement('span'),
    }
    const winner = document.createElement('div')
    winner.className = 'text-center'
    const winText = document.createElement('span')
    this.loc.register('winText', winText)
    winner.append(this.result.winner, ' ', winText)

    const score = document.createElement('div')
    const scoreLabel = document.createElement('span')
    this.loc.register('score', scoreLabel)
    score.append(scoreLabel, ': ', this.result.score)

    const time = document.createElement('div')
    const timeLabel = document.createElement('span')
    this.loc.register('time', timeLabel)
    time.append(timeLabel, ': ', this.result.time)

    const result = document.createElement('div')
    result.classList.add('text-shadow')
    result.append(winner, score, time)

    this.inner.append(h2, result, btns)
    this.container.append(this.inner)
  }

  public show = (state = true) => {
    if (state) {
      this.container.removeAttribute('style')
    } else {
      this.container.setAttribute('style', 'display: none')
    }
    this.inner.classList.toggle(modal.bounce, state)
    this.isActive = state
  }

  public get element() {
    return this.container
  }
}

export class WinModal extends WinView {
  private confirmationModal: ConfirmationModal
  private restart: () => void
  private menu: () => void
  private gamepadService: GamepadService

  constructor({ restart, menu }: { restart: () => void, menu: () => void }) {
    super()
    this.restart = restart
    this.menu = menu
    this.confirmationModal = inject(ConfirmationModal)

    this.gamepadService = inject(GamepadService)
    this.gamepadService.registerCallbacks({ onButtonUp: this.onGamepadButtonUp })

    this.button.replay.addEventListener('click', this.handleReplay)
    this.button.menu.addEventListener('click', this.handleMenu)
  }

  public handleFinish = (result: { score: number, time: number, player: 'top' | 'bottom' }) => {
    const name = result.player === 'top' ? this.loc.get('upper') : this.loc.get('bottom')
    this.result.winner.innerText = name
    this.result.score.innerText = result.score.toString()
    const m = Math.floor(result.time / 60000)
    const s = Math.floor(result.time / 1000 - m * 60)
    this.result.time.innerText = `${m}:${s}`

    this.show(true)
  }

  private onGamepadButtonUp = (_gamepadIndex: number, buttonIndex: number) => {
    if (!this.isActive) return

    if (buttonIndex === 9) {  // Start button
      // this.handleMenu()
    }
    if (buttonIndex === 0 || buttonIndex === 1 || buttonIndex === 8) {  // Accept / Cancel button
      this.handleReplay()
    }
  }

  private handleReplay = () => {
    this.confirmationModal?.show({
      text: this.loc.get('replay'), acceptCallback: () => {
        this.show(false)
        this.restart()
      }
    })
  }

  private handleMenu = () => {
    this.show(false)
    this.menu()
  }
}
