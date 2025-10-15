import { Sound } from '~/service/sound'
import { iconSrc } from "~/ui/icons"
import { buttonIcon } from '~/ui/button/icon'
import { Localization } from '~/service/localization'

import styles from './overlay.module.css'

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

  public get element() {
    return this.container
  }
}

export class Overlay extends OverlayView {
  private loc: Localization
  private sound: Sound
  private player: { level: HTMLSpanElement, score: HTMLSpanElement, combo: HTMLSpanElement }

  constructor({ handlePause, initialScore }: { handlePause: (_show: boolean) => void, initialScore?: number }) {
    super()
    this.loc = new Localization()
    this.sound = new Sound()

    const level = document.createElement('div')
    const levelLabel = document.createElement('span')
    this.loc.register('level', levelLabel)
    const levelValue = document.createElement('span')
    level.className = styles.player
    levelValue.innerText = '1'
    level.append(levelLabel, ': ', levelValue)

    const score = document.createElement('div')
    const scoreLabel = document.createElement('span')
    this.loc.register('score', scoreLabel)
    const scoreValue = document.createElement('span')
    score.className = styles.player
    scoreValue.innerText = (initialScore || 0).toString()
    score.append(scoreLabel, ': ', scoreValue)

    const combo = document.createElement('div')
    combo.className = styles.combo
    combo.setAttribute('style', 'display: none;')
    const comboLabel = document.createElement('span')
    this.loc.register('combo', comboLabel)
    const comboValue = document.createElement('span')
    comboValue.innerText = 'x0'
    combo.append(comboLabel, ': ', comboValue)

    const player = document.createElement('div')
    player.append(level, score, combo)
    this.player = { level: levelValue, score: scoreValue, combo: comboValue }

    const sound = buttonIcon({ src: this.sound.muted ? iconSrc.soundOn : iconSrc.soundOff })
    const soundIconElement = sound.children[0] as HTMLImageElement
    sound.addEventListener('mousedown', (event) => {
      event.stopPropagation()
      this.handleSoundToggle(soundIconElement)
    })
    this.upper.append(player, sound)

    const pause = buttonIcon({ src: iconSrc.pause })
    pause.addEventListener('mousedown', (event) => {
      event.stopPropagation()
      handlePause(true)
    })
    this.bottom.append(pause)
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

  private handleSoundToggle = (iconElement: HTMLImageElement) => {
    const muted = this.sound.muted
    this.sound.mute = !muted
    iconElement.src = muted ? iconSrc.soundOff : iconSrc.soundOn
  }
}
