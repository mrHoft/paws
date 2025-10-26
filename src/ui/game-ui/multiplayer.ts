import { Localization } from '~/service/localization'
import { inject } from '~/utils/inject'

import styles from './ui.module.css'
import layer from '~/ui/layers.module.css'

class MultiplayerView {
  protected loc: Localization
  protected container: HTMLDivElement
  protected sequence: HTMLDivElement
  protected player: Record<'top' | 'bottom', { element: HTMLDivElement, progress: HTMLDivElement, score: HTMLSpanElement, combo: HTMLSpanElement }>

  constructor() {
    this.loc = inject(Localization)
    this.container = document.createElement('div')
    this.container.classList.add(layer['multiplayer-ui'], styles.ui, styles.center, 'text-shadow')
    this.container.setAttribute('style', `display: none;`)

    const middle = document.createElement('div')
    middle.className = styles.middle
    this.sequence = document.createElement('div')
    this.sequence.className = styles.sequence
    middle.append(this.sequence)

    this.player = {
      top: {
        element: document.createElement('div'),
        progress: document.createElement('div'),
        score: document.createElement('span'),
        combo: document.createElement('span')
      },
      bottom: {
        element: document.createElement('div'),
        progress: document.createElement('div'),
        score: document.createElement('span'),
        combo: document.createElement('span')
      }
    }

    this.player.top.element.classList.add(styles.ui__top)
    this.player.bottom.element.classList.add(styles.ui__bot)

    for (const player of ['top', 'bottom'] as ('top' | 'bottom')[]) {
      this.player[player].element.append(
        this.createProgressBar(player),
        this.createScoreElement(player),
        this.createComboElement(player)
      )
    }

    this.container.append(this.player.top.element, this.player.bottom.element, middle)
  }

  private createScoreElement = (player: 'top' | 'bottom') => {
    const container = document.createElement('div')
    container.className = styles.score
    const label = document.createElement('span')
    this.loc.register('score', label)
    this.player[player].score.innerText = '0'
    container.append(label, ': ', this.player[player].score)
    return container
  }

  private createComboElement = (player: 'top' | 'bottom') => {
    const container = document.createElement('div')
    container.className = styles.combo
    container.setAttribute('style', 'display: none;')
    const label = document.createElement('span')
    this.loc.register('combo', label)
    this.player[player].combo.innerText = 'x0'
    container.append(label, ': ', this.player[player].combo)
    return container
  }

  private createProgressBar = (player: 'top' | 'bottom') => {
    const container = document.createElement('div')
    container.classList.add(styles.progress)
    this.player[player].progress.classList.add(styles.progress__bar)
    this.player[player].progress.setAttribute('style', `width: 0;`)
    container.append(this.player[player].progress)
    return container
  }

  public show = (state = true) => {
    if (state) {
      this.container.removeAttribute('style')
    } else {
      this.container.setAttribute('style', 'display: none')
    }
  }

  public get element() {
    return this.container
  }
}

export class MultiplayerUI extends MultiplayerView {
  constructor() {
    super()
  }

  public startCount = () => {
    const sequence = ['3', '2', '1']
    sequence.push(this.loc.get('go'))

    const count = () => {
      const value = sequence.shift()
      if (value) {
        this.sequence.innerText = value
        this.bounce(this.sequence)
        setTimeout(count, 1000)
      } else {
        this.sequence.innerText = ''
      }
    }
    count()
  }

  public handleProgress = (value: number, player?: 'top' | 'bottom') => {
    if (!player) return
    this.player[player].progress.setAttribute('style', `width: ${value}%;`)
  }

  public handleScore = (value: number, player?: 'top' | 'bottom') => {
    if (!player) return
    this.player[player].score.innerText = value.toString()
    this.bounce(this.player[player].score.parentElement)
  }

  public handleCombo = (value: number, player?: 'top' | 'bottom') => {
    if (!player) return
    this.player[player].combo.innerText = `x${value}`
    if (value) {
      this.bounce(this.player[player].combo.parentElement)
    } else {
      this.player[player].combo.parentElement?.setAttribute('style', 'display: none;')
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
