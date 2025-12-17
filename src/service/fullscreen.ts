import { debounce } from "~/utils/throttle"
import { Injectable } from "~/utils/inject"

interface FullscreenDocument extends Document {
  mozFullScreenEnabled?: boolean,
  webkitFullscreenEnabled?: boolean,
  mozFullScreenElement: Element | null,
  webkitFullscreenElement: Element | null,
  mozCancelFullScreen: () => Promise<void>,
  webkitExitFullscreen: () => Promise<void>
}

interface FullscreenElement extends HTMLElement {
  mozRequestFullScreen: () => Promise<void>
  webkitRequestFullscreen: () => Promise<void>
  msRequestFullscreen: () => Promise<void>
}

@Injectable
export class FullscreenService {
  private document = document as FullscreenDocument
  private handlers: Record<'fullscreenchange', Map<symbol, (_active: boolean) => void>> = { fullscreenchange: new Map() }

  constructor() {
    document.addEventListener('fullscreenchange', debounce(() => {
      if (this.isFullscreenActive()) {
        // console.log('Entered fullscreen.')
        this.handlers['fullscreenchange'].forEach(handler => handler(true))
      } else {
        // console.log('Exited fullscreen.')
        this.handlers['fullscreenchange'].forEach(handler => handler(false))
      }
    }))
  }

  public registerEvents = ({ fullscreenchange }: { fullscreenchange?: (_active: boolean) => void }) => {
    if (typeof fullscreenchange === 'function') {
      const key = Symbol()
      this.handlers['fullscreenchange'].set(key, fullscreenchange)
      return () => {
        this.handlers['fullscreenchange']?.delete(key)
      }
    }
  }

  public isFullscreenActive = () => !!(this.document.fullscreenElement || this.document.mozFullScreenElement || this.document.webkitFullscreenElement);

  public switch = (fullscreen: boolean, el: HTMLElement = document.documentElement) => {
    if (fullscreen) {
      this.activate(el)
    } else if (this.isFullscreenActive()) {
      this.deactivate()
    }
  }

  private activate = async (el: HTMLElement) => {
    const element = (el || document.documentElement) as FullscreenElement
    const fullscreenEnabled = this.document.fullscreenEnabled || this.document.mozFullScreenEnabled || this.document.webkitFullscreenEnabled

    if (!fullscreenEnabled) return;

    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen()
      } else if (element.mozRequestFullScreen) {
        await element.mozRequestFullScreen()
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen()
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen()
      }
    } catch (error) {
      console.error('Error activating fullscreen:', error)
    }
  }

  private deactivate = async () => {
    if (this.document.exitFullscreen) {
      await this.document.exitFullscreen()
    } else if (this.document.mozCancelFullScreen) {
      await this.document.mozCancelFullScreen()
    } else if (this.document.webkitExitFullscreen) {
      await this.document.webkitExitFullscreen()
    }
  }
}
