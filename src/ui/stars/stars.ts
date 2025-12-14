import { iconSrc } from "~/ui/icons"
import { SoundService } from "~/service/sound"
import { inject } from '~/utils/inject'

import styles from './stars.module.css'

const MAX = 3

export class ProphecyStars {
  private soundService: SoundService
  private component: HTMLDivElement
  private stars: HTMLImageElement[] = []
  private timer: ReturnType<typeof setTimeout> | null = null

  constructor(props?: { small: boolean }) {
    this.soundService = inject(SoundService)
    this.component = document.createElement('div')
    this.component.classList.add(styles.stars)
    if (props?.small) {
      this.component.classList.add(styles.small)
    }
    for (let i = 0; i < MAX; i += 1) {
      const outline = document.createElement('img')
      outline.setAttribute('draggable', 'false')
      outline.src = iconSrc.starOutline

      const star = document.createElement('img')
      star.setAttribute('draggable', 'false')
      star.setAttribute('style', 'display: none;')
      star.src = iconSrc.star
      this.stars.push(star)

      const span = document.createElement('span')
      span.append(outline, star)
      this.component.append(span)
    }
  }

  public setStars = (count: number) => {
    this.stars.forEach((star, i) => {
      if ((i + 1) <= count) {
        star.removeAttribute('style')
      } else {
        star.setAttribute('style', 'display: none;')
      }
    })
  }

  public showStars = (count: number) => {
    for (const star of this.stars) {
      star.setAttribute('style', 'display: none;')
      star.classList.remove(styles.bounce)
    }

    let i = 0
    const iterate = () => {
      const star = this.stars[i]
      if ((i + 1) <= count) {
        star.removeAttribute('style')
        star.classList.add(styles.bounce)
        this.soundService.play('pum')
      }
      i += 1
      if (i < MAX) {
        this.timer = setTimeout(iterate, 500)
      }
    }

    this.timer = setTimeout(iterate, 500)
  }

  public get element() { return this.component }

  public stop = () => {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }
}
