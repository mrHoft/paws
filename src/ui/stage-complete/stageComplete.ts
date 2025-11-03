import { iconSrc } from "~/ui/icons"
import { Localization } from '~/service/localization'
import { GamepadService } from '~/service/gamepad'
import { inject } from '~/utils/inject'
import { formatTime } from "~/utils/time"
import { SoundService } from "~/service/sound"
import { Caught } from '~/ui/caught/caught'
import { Storage } from "~/service/storage"

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

    const border = document.createElement('div')
    border.classList.add(modal.inner__border, modal.inner__mask)
    const bg = document.createElement('div')
    bg.classList.add(modal.inner__bg, modal.inner__mask, modal.inner__shadow)

    this.inner = document.createElement('div')
    this.inner.classList.add(modal.inner, modal.small)
    const h3 = document.createElement('h3')
    this.loc.register('stageComplete', h3)

    this.button = document.createElement('div')
    this.button.className = modal.button
    const continueLabel = document.createElement('span')
    this.loc.register('menu', continueLabel)
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

    const content = document.createElement('div')
    content.className = modal.inner__content
    content.append(h3, results, this.button)

    this.inner.append(border, bg, content)
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
  private storage: Storage
  private menu: () => void
  private gamepadService: GamepadService
  private soundService: SoundService
  private caught: Caught
  private timer: ReturnType<typeof setTimeout> | null = null

  constructor({ menu }: { menu: () => void }) {
    super()
    this.menu = menu

    this.storage = inject(Storage)
    this.caught = inject(Caught)
    this.soundService = inject(SoundService)
    this.gamepadService = inject(GamepadService)
    this.gamepadService.registerCallbacks({ onButtonUp: this.onGamepadButtonUp })

    this.button.addEventListener('click', this.handleMenu)
  }

  public handleComplete = (result: { score: number, time: number, caught?: number, prophecy?: number }) => {
    this.result.score.innerText = result.score.toString()
    this.result.time.innerText = formatTime(result.time)
    this.result.caught.innerText = (result.caught || 0).toString()
    this.showStars(result.prophecy)

    this.storage.set('data.score', (this.storage.get<number>('data.score') || 0) + result.score)

    this.show(true)
  }

  private showStars = (prophecy = 0.3) => {
    const stars = this.result.stars.children
    for (const star of stars) {
      star.setAttribute('style', 'display: none;')
      star.classList.remove(styles.bounce)
    }

    let i = 0
    const count = () => {
      const star = stars[i]
      if ((i + 1) / stars.length <= prophecy + 0.01) {
        star.removeAttribute('style')
        star.classList.add(styles.bounce)
        this.soundService.play('tone-high')
        this.caught.handleUpdate('star')
      }
      i += 1
      if (i < stars.length) {
        this.timer = setTimeout(count, 500)
      }
    }

    count()
  }

  private onGamepadButtonUp = (_gamepadIndex: number, buttonIndex: number) => {
    if (!this.isActive) return

    if (buttonIndex === 9) {  // Start button
      this.handleMenu()
    }
  }

  private handleMenu = () => {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    this.show(false)
    this.menu()
  }
}
