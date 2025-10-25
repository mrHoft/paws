import { Audio } from '~/service/audio'
import { iconSrc } from "~/ui/icons"
import { buttonIcon } from '~/ui/button/icon'
import { Localization } from '~/service/localization'
import { inject } from '~/utils/inject'

import styles from './overlay.module.css'
import layer from '~/ui/layers.module.css'

class OverlayView {
  protected container: HTMLDivElement
  protected upper: HTMLDivElement
  protected middle: HTMLDivElement
  protected bottom: HTMLDivElement

  constructor() {
    this.container = document.createElement('div')
    this.container.classList.add(layer.overlay, styles.overlay, 'text-shadow')

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
  private audio: Audio
  private player: Record<'level' | 'score' | 'combo', { el: HTMLDivElement, value: HTMLSpanElement }>

  constructor({ enginePause, initialScore }: { enginePause: (_show: boolean) => void, initialScore?: number }) {
    super()
    this.loc = inject(Localization)
    this.audio = inject(Audio)

    const level = document.createElement('div')
    const levelLabel = document.createElement('span')
    this.loc.register('level', levelLabel)
    const levelValue = document.createElement('span')
    level.className = styles.level
    levelValue.innerText = '1'
    level.append(levelLabel, ': ', levelValue)

    const score = document.createElement('div')
    const scoreLabel = document.createElement('span')
    this.loc.register('score', scoreLabel)
    const scoreValue = document.createElement('span')
    score.className = styles.score
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
    this.player = { level: { el: level, value: levelValue }, score: { el: score, value: scoreValue }, combo: { el: combo, value: comboValue } }

    const sound = buttonIcon({ src: this.audio.muted ? iconSrc.soundOn : iconSrc.soundOff })
    const soundIconElement = sound.children[0] as HTMLImageElement
    sound.addEventListener('mousedown', (event) => {
      event.stopPropagation()
      this.handleSoundToggle(soundIconElement)
    })
    this.upper.append(player, sound)

    const pause = buttonIcon({ src: iconSrc.pause })
    pause.addEventListener('mousedown', (event) => {
      event.stopPropagation()
      enginePause(true)
    })
    this.bottom.append(pause)
  }

  public handleLevel = (value: number) => {
    this.player.level.value.innerText = (value + 1).toString()
    this.player.level.el.classList.add(styles.bounce)
    setTimeout(() => {
      this.player.level.el.classList.remove(styles.bounce)
    }, 325)
  }

  public handleScore = (value: number) => {
    this.player.score.value.innerText = value.toString()
    this.player.score.el.classList.add(styles.bounce)
    setTimeout(() => {
      this.player.score.el.classList.remove(styles.bounce)
    }, 325)
  }

  public handleCombo = (value: number) => {
    this.player.combo.value.innerText = `x${value}`
    if (value) {
      this.player.combo.el.setAttribute('style', 'display: block;')
      this.player.combo.el.classList.add(styles.bounce)
      setTimeout(() => {
        this.player.combo.el.classList.remove(styles.bounce)
      }, 325)
    } else {
      this.player.combo.el.setAttribute('style', 'display: none;')
    }
  }

  public handleTooltip = (message: string) => {
    this.middle.innerText = message
  }

  private handleSoundToggle = (iconElement: HTMLImageElement) => {
    const muted = this.audio.muted
    this.audio.mute = !muted
    iconElement.src = muted ? iconSrc.soundOff : iconSrc.soundOn
  }
}
