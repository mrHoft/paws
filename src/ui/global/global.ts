import { Caught } from '~/ui/caught/caught'
import { isFullscreenActive, fullscreenSwitch } from '~/utils/fullscreen'
import { iconSrc } from "~/ui/icons"
import { buttonIcon } from '~/ui/button/icon'

import styles from './global.module.css'

class OverlayView {
  protected container: HTMLDivElement
  protected upper: HTMLDivElement
  protected bottom: HTMLDivElement

  constructor() {
    this.container = document.createElement('div')
    this.container.className = `${styles.global_layer} text-shadow`

    this.upper = document.createElement('div')
    this.upper.className = styles.row_upper
    this.bottom = document.createElement('div')
    this.bottom.className = styles.row_bottom

    this.container.append(this.upper, this.bottom)
  }

  public get element() {
    return this.container
  }
}

export class GlobalUI extends OverlayView {
  public readonly caught: Caught

  constructor() {
    super()
    this.caught = new Caught()

    this.upper.append(this.caught.element)

    const fullscreen = buttonIcon({ src: iconSrc.fullscreen })
    const fullscreenIconElement = fullscreen.children[0] as HTMLImageElement
    fullscreen.addEventListener('mousedown', (event) => {
      event.stopPropagation()
      this.handleFullscreenToggle(fullscreenIconElement)
    })
    this.bottom.append(fullscreen)
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
