import styles from './overlay.module.css'

const icons = {
  settings: '/icons/settings.svg',
  fullscreen: '/icons/fullscreen.svg',
  pause: '/icons/pause.svg'
}

class OverlayView {
  protected container: HTMLDivElement
  protected upper: HTMLDivElement
  protected bottom: HTMLDivElement

  constructor() {
    this.container = document.createElement('div')
    this.container.className = styles.overlay

    this.upper = document.createElement('div')
    this.upper.className = styles.row
    this.bottom = document.createElement('div')
    this.bottom.className = styles.row

    this.container.append(this.upper, this.bottom)
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
  private player: { level: HTMLSpanElement, score: HTMLSpanElement, combo: HTMLSpanElement }

  constructor() {
    super()
    const row1 = document.createElement('div')
    const level = document.createElement('span')
    level.innerText = '0'
    row1.append('Level: ', level)

    const row2 = document.createElement('div')
    const score = document.createElement('span')
    score.innerText = '0'
    row2.append('Score: ', score)

    const row3 = document.createElement('div')
    const combo = document.createElement('span')
    combo.innerText = '0'
    row3.append('Combo: ', combo)

    const player = document.createElement('div')
    player.append(row1, row2, row3)
    this.player = { level, score, combo }

    const pause = this.createButton({ src: icons.pause })
    this.upper.append(player, pause)

    const settings = this.createButton({ src: icons.settings })
    const fullscreen = this.createButton({ src: icons.fullscreen })
    this.bottom.append(settings, fullscreen)
  }

  public handleLevel = (value: number) => {
    this.player.level.innerText = value.toString()
  }

  public handleScore = (value: number) => {
    this.player.score.innerText = value.toString()
  }

  public handleCombo = (value: number) => {
    this.player.combo.innerText = value.toString()
  }
}
