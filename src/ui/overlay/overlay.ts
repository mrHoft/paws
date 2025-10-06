import { GAME } from '~/const'
import { Caught } from './caught'

import styles from './overlay.module.css'

const icons = {
  settings: '/icons/settings.svg',
  fullscreen: '/icons/fullscreen.svg',
  fullscreenExit: '/icons/fullscreen-exit.svg',
  pause: '/icons/pause.svg'
}

class OverlayView {
  protected container: HTMLDivElement
  protected upper: HTMLDivElement
  protected middle: HTMLDivElement
  protected bottom: HTMLDivElement

  constructor() {
    this.container = document.createElement('div')
    this.container.className = styles.overlay_layer

    this.upper = document.createElement('div')
    this.upper.className = styles.row
    this.middle = document.createElement('div')
    this.middle.className = styles.middle
    const blank = document.createElement('div')
    this.bottom = document.createElement('div')
    this.bottom.className = styles.row

    this.container.append(this.upper, this.middle, blank, this.bottom)
  }

  protected createButton = ({ src }: { src: string }) => {
    const button = document.createElement('div')
    const icon = document.createElement('img')
    icon.src = src
    icon.width = icon.height = 32
    button.append(icon)
    return button
  }

  public get element() {
    return this.container
  }
}

export class Overlay extends OverlayView {
  public readonly caught: Caught
  private player: { level: HTMLSpanElement, score: HTMLSpanElement, combo: HTMLSpanElement }

  constructor() {
    super()
    this.caught = new Caught()

    const level = document.createElement('div')
    const levelValue = document.createElement('span')
    level.className = styles.player
    levelValue.innerText = '1'
    level.append('Level: ', levelValue)

    const score = document.createElement('div')
    const scoreValue = document.createElement('span')
    score.className = styles.player
    scoreValue.innerText = '0'
    score.append('Score: ', scoreValue)

    const combo = document.createElement('div')
    combo.className = styles.combo
    combo.setAttribute('style', 'display: none;')
    const comboValue = document.createElement('span')
    comboValue.innerText = 'x0'
    combo.append('Combo: ', comboValue)

    const player = document.createElement('div')
    player.append(level, score, combo)
    this.player = { level: levelValue, score: scoreValue, combo: comboValue }

    const pause = this.createButton({ src: icons.pause })
    this.upper.append(player, this.caught.element, pause)

    const settings = this.createButton({ src: icons.settings })

    const botRight = document.createElement('div')
    botRight.className = styles['bot-right']
    const version = document.createElement('div')
    version.innerText = GAME.version
    const fullscreen = this.createButton({ src: icons.fullscreen })
    botRight.append(version, fullscreen)
    this.bottom.append(settings, botRight)
  }

  public handleLevel = (value: number) => {
    this.player.level.innerText = (value + 1).toString()
  }

  public handleScore = (value: number) => {
    this.player.score.innerText = value.toString()
  }

  public handleCombo = (value: number) => {
    this.player.combo.innerText = `x${value}`
    const parent = this.player.combo.parentElement
    if (value) {
      parent?.setAttribute('style', 'display: block;')
    } else {
      parent?.setAttribute('style', 'display: none;')
    }
  }

  public handleTooltip = (message: string) => {
    this.middle.innerText = message
  }
}
