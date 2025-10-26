import { GAME } from '~/const'
import { Audio } from '~/service/audio'
import { iconSrc } from "~/ui/icons"
import { buttonIcon } from '~/ui/button/icon'
import { Caught } from '~/ui/caught/caught'
import { Localization } from '~/service/localization'
import { inject } from '~/utils/inject'
import { isFullscreenActive, fullscreenSwitch } from '~/utils/fullscreen'

import styles from './ui.module.css'
import layer from '~/ui/layers.module.css'

class SinglePlayerView {
  protected container: HTMLDivElement
  protected upper: HTMLDivElement
  protected middle: HTMLDivElement
  protected bottom: HTMLDivElement

  constructor() {
    this.container = document.createElement('div')
    this.container.classList.add(layer['single-ui'], styles.ui, 'text-shadow')

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

export class SinglePlayerUI extends SinglePlayerView {
  private loc: Localization
  private audio: Audio
  private player: Record<'level' | 'score' | 'combo', { element: HTMLDivElement, value: HTMLSpanElement }> & { element: HTMLDivElement }
  private btnSound: HTMLDivElement
  private btnPause: HTMLDivElement
  private btnFullscreen?: HTMLDivElement
  public readonly caught: Caught

  constructor({ enginePause, initialScore }: { enginePause: (_show: boolean) => void, initialScore?: number }) {
    super()
    this.loc = inject(Localization)
    this.audio = inject(Audio)
    this.caught = new Caught()

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
    this.player = {
      element: player,
      level: { element: level, value: levelValue },
      score: { element: score, value: scoreValue },
      combo: { element: combo, value: comboValue }
    }

    this.btnSound = buttonIcon({ src: this.audio.muted ? iconSrc.soundOn : iconSrc.soundOff })
    const soundIconElement = this.btnSound.children[0] as HTMLImageElement
    this.btnSound.addEventListener('mousedown', (event) => {
      event.stopPropagation()
      this.handleSoundToggle(soundIconElement)
    })

    const upperLeft = document.createElement('div')
    upperLeft.append(player)
    const upperRight = document.createElement('div')
    upperRight.append(this.btnSound)
    this.upper.append(upperLeft, this.caught.element, upperRight)

    this.btnPause = buttonIcon({ src: iconSrc.pause })
    this.btnPause.addEventListener('mousedown', (event) => {
      event.stopPropagation()
      enginePause(true)
    })

    const bottomLeft = document.createElement('div')
    bottomLeft.append(this.btnPause)
    this.bottom.append(bottomLeft)

    if (GAME.fullscreenControl) {
      this.btnFullscreen = buttonIcon({ src: iconSrc.fullscreen })
      const fullscreenIconElement = this.btnFullscreen.children[0] as HTMLImageElement
      this.btnFullscreen.addEventListener('mousedown', (event) => {
        event.stopPropagation()
        this.handleFullscreenToggle(fullscreenIconElement)
      })
      const bottomRight = document.createElement('div')
      bottomRight.append(this.btnFullscreen)
      this.bottom.append(bottomRight)
    }
  }

  public toggleView = (view: 'menu' | 'single-player' | 'multiplayer') => {
    if (view === 'menu') {
      this.middle.setAttribute('style', 'display: none;')
      this.player.element.setAttribute('style', 'display: none;')
      this.btnSound.setAttribute('style', 'display: none;')
      this.btnPause.setAttribute('style', 'display: none;')
      this.caught.element.removeAttribute('style')
    }
    if (view === 'single-player') {
      this.middle.removeAttribute('style')
      this.player.element.removeAttribute('style')
      this.btnSound.removeAttribute('style')
      this.btnPause.removeAttribute('style')
      this.caught.element.removeAttribute('style')
    }
    if (view === 'multiplayer') {
      this.middle.setAttribute('style', 'display: none;')
      this.player.element.setAttribute('style', 'display: none;')
      this.btnSound.removeAttribute('style')
      this.btnPause.removeAttribute('style')
      this.caught.element.setAttribute('style', 'display: none;')
    }
  }

  public handleLevel = (value: number) => {
    this.player.level.value.innerText = (value + 1).toString()
    this.player.level.element.classList.add(styles.bounce)
    setTimeout(() => {
      this.player.level.element.classList.remove(styles.bounce)
    }, 325)
  }

  public handleScore = (value: number) => {
    this.player.score.value.innerText = value.toString()
    this.player.score.element.classList.add(styles.bounce)
    setTimeout(() => {
      this.player.score.element.classList.remove(styles.bounce)
    }, 325)
  }

  public handleCombo = (value: number) => {
    this.player.combo.value.innerText = `x${value}`
    if (value) {
      this.player.combo.element.setAttribute('style', 'display: block;')
      this.player.combo.element.classList.add(styles.bounce)
      setTimeout(() => {
        this.player.combo.element.classList.remove(styles.bounce)
      }, 325)
    } else {
      this.player.combo.element.setAttribute('style', 'display: none;')
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

  private handleFullscreenToggle = (iconElement: HTMLImageElement) => {
    const active = isFullscreenActive()
    const element = document.querySelector('main')
    if (element) {
      fullscreenSwitch(!active, element)
      iconElement.src = active ? iconSrc.fullscreen : iconSrc.fullscreenExit
    }
  }
}
