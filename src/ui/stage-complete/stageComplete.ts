import { iconSrc } from "~/ui/icons"
import { Localization } from '~/service/localization'
import { GamepadService } from '~/service/gamepad'
import { inject } from '~/utils/inject'

import styles from './stageComplete.module.css'
import modal from '~/ui/modal.module.css'
import layer from '~/ui/layers.module.css'

class StageCompleteView {
  protected loc: Localization
  protected container: HTMLDivElement
  protected inner: HTMLDivElement
  protected button: HTMLDivElement
  protected result: {
    stars: HTMLDivElement,
    score: HTMLSpanElement,
    time: HTMLSpanElement,
    caught: HTMLSpanElement
  }
  protected isActive = false

  constructor() {
    this.loc = inject(Localization)

    this.container = document.createElement('div')
    this.container.classList.add(layer.win, styles.container)
    this.container.setAttribute('style', `display: none;`)

    this.inner = document.createElement('div')
    this.inner.classList.add(modal.inner, modal.small)
    const h3 = document.createElement('h3')
    this.loc.register('stageComplete', h3)

    this.button = document.createElement('div')
    this.button.className = modal.button
    const continueLabel = document.createElement('span')
    this.loc.register('backToMenu', continueLabel)
    const continueIcon = document.createElement('img')
    continueIcon.src = iconSrc.menu
    this.button.append(continueIcon, continueLabel)

    this.result = {
      stars: document.createElement('div'),
      score: document.createElement('span'),
      time: document.createElement('span'),
      caught: document.createElement('span'),
    }

    this.result.stars.className = styles.stars
    for (let i = 0; i < 3; i += 1) {
      const img = document.createElement('img')
      img.src = iconSrc.star
      this.result.stars.append(img)
    }

    const score = document.createElement('div')
    const scoreLabel = document.createElement('span')
    this.loc.register('score', scoreLabel)
    score.append(scoreLabel, ': ', this.result.score)

    const time = document.createElement('div')
    const timeLabel = document.createElement('span')
    this.loc.register('time', timeLabel)
    time.append(timeLabel, ': ', this.result.time)

    const caught = document.createElement('div')
    const caughtLabel = document.createElement('span')
    this.loc.register('caught', caughtLabel)
    caught.append(caughtLabel, ': ', this.result.caught)

    const results = document.createElement('div')
    results.className = styles.results
    results.append(this.result.stars, score, time, caught)

    this.inner.append(h3, results, this.button)
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

export class StageCompleteModal extends StageCompleteView {
  private menu: () => void
  private gamepadService: GamepadService

  constructor({ menu }: { menu: () => void }) {
    super()
    this.menu = menu

    this.gamepadService = inject(GamepadService)
    this.gamepadService.registerCallbacks({ onButtonUp: this.onGamepadButtonUp })

    this.button.addEventListener('click', this.handleMenu)
  }

  public handleComplete = (result: { score: number, time: number, caught?: number }) => {
    this.result.score.innerText = result.score.toString()
    const m = Math.floor(result.time / 60000)
    const s = Math.floor(result.time / 1000 - m * 60)
    this.result.time.innerText = `${m}:${s}`
    this.result.caught.innerText = (result.caught || 0).toString()

    this.show(true)
  }

  private onGamepadButtonUp = (_gamepadIndex: number, buttonIndex: number) => {
    if (!this.isActive) return

    if (buttonIndex === 9) {  // Start button
      this.handleMenu()
    }
  }

  private handleMenu = () => {
    this.show(false)
    this.menu()
  }
}
