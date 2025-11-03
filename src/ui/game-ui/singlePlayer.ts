import { GENERAL } from '~/const'
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
  protected player: { element: HTMLDivElement, progress: HTMLDivElement, score: HTMLSpanElement, combo: HTMLSpanElement }
  private loc: Localization

  constructor() {
    this.loc = inject(Localization)

    this.container = document.createElement('div')
    this.container.classList.add(layer['single-ui'], styles.ui, 'text-shadow')

    this.upper = document.createElement('div')
    this.upper.className = styles.row
    this.middle = document.createElement('div')
    this.middle.className = styles.middle
    const blank = document.createElement('div')
    this.bottom = document.createElement('div')
    this.bottom.className = styles.row

    const progress = document.createElement('div')
    progress.classList.add(styles.progress)
    const progressBar = document.createElement('div')
    progressBar.classList.add(styles.progress__bar)
    progressBar.setAttribute('style', `width: 0;`)
    progress.append(progressBar)

    const score = document.createElement('div')
    const scoreLabel = document.createElement('span')
    this.loc.register('score', scoreLabel)
    const scoreValue = document.createElement('span')
    score.className = styles.score
    scoreValue.innerText = '0'
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
    player.append(progress, score, combo)
    this.player = {
      element: player,
      progress: progressBar,
      score: scoreValue,
      combo: comboValue,
    }

    this.container.append(this.upper, this.middle, blank, this.bottom)
  }

  public get element() {
    return this.container
  }
}

export class SinglePlayerUI extends SinglePlayerView {
  private audio: Audio
  private btnSound: HTMLDivElement
  private btnPause: HTMLDivElement
  private btnFullscreen?: HTMLDivElement
  private caught: Caught

  constructor({ enginePause }: { enginePause: (_show: boolean) => void }) {
    super()
    this.audio = inject(Audio)
    this.caught = inject(Caught)

    this.btnSound = buttonIcon({ src: this.audio.muted ? iconSrc.soundOn : iconSrc.soundOff })
    const soundIconElement = this.btnSound.children[0] as HTMLImageElement
    this.btnSound.addEventListener('mousedown', (event) => {
      event.stopPropagation()
      this.handleSoundToggle(soundIconElement)
    })

    const upperLeft = document.createElement('div')
    upperLeft.append(this.player.element)
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

    if (GENERAL.fullscreenControl) {
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

  public handleProgress = (value: number) => {
    this.player.progress.setAttribute('style', `width: ${value}%;`)
  }

  public handleScore = (value: number) => {
    this.player.score.innerText = value.toString()
    this.bounce(this.player.score.parentElement)
  }

  public handleCombo = (value: number) => {
    this.player.combo.innerText = `x${value}`
    if (value) {
      this.player.combo.parentElement?.removeAttribute('style')
      this.bounce(this.player.combo.parentElement)
    } else {
      this.player.combo.parentElement?.setAttribute('style', 'display: none;')
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

  private bounce(element: HTMLElement | null) {
    if (element) {
      element.setAttribute('style', 'display: block;')
      element.classList.add(styles.bounce)
      setTimeout(() => {
        element.classList.remove(styles.bounce)
      }, 325)
    }
  }
}
