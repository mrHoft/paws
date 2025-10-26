import { buttonClose } from "~/ui/button"
import { Localization } from '~/service/localization'
import { GamepadService } from "~/service/gamepad"
import { Injectable, inject } from "~/utils/inject"

import modal from '~/ui/modal.module.css'
import layer from '~/ui/layers.module.css'

function about() {
  const link = document.createElement('a')
  link.innerText = 'mrHoft'
  link.href = 'mailto:mrhoft@yandex.ru'

  const paragraph = document.createElement('p')
  paragraph.append('Developed by\u00a0', link, '\u00a0in 2025.')

  return paragraph
}

class AboutView {
  protected loc: Localization
  protected container: HTMLDivElement
  protected inner: HTMLDivElement
  protected close: HTMLDivElement
  protected isActive = false

  constructor() {
    this.loc = inject(Localization)
    this.container = document.createElement('div')
    this.container.classList.add(layer.about, modal.outer)
    this.container.setAttribute('style', 'display: none;')

    this.inner = document.createElement('div')
    this.inner.className = modal.inner

    const header = document.createElement('h3')
    this.loc.register('about', header)

    this.close = buttonClose()

    this.inner.append(header, about(), this.close)
    this.container.append(this.inner)
  }

  public show = (state = true) => {
    if (state) {
      this.container.removeAttribute('style')
    } else {
      this.container.setAttribute('style', 'display: none')
    }
    this.inner.classList.toggle(modal.bounce, state)
    this.isActive = state
  }

  public hide = () => {
    this.show(false)
  }

  public get element() {
    return this.container
  }
}

@Injectable
export class AboutUI extends AboutView {
  private gamepadService: GamepadService
  private onClose?: () => void

  constructor() {
    super()
    this.gamepadService = inject(GamepadService)
    this.gamepadService.registerCallbacks({
      onButtonUp: this.onGamepadButtonUp
    })

    this.container.addEventListener('click', event => {
      const { target, currentTarget } = event;
      if (target === currentTarget) {
        this.show(false)
        if (this.onClose) this.onClose()
      }
    })

    this.close.addEventListener('click', () => {
      this.show(false)
      if (this.onClose) this.onClose()
    })
  }

  public registerCallback = ({ onClose }: { onClose: () => void }) => {
    this.onClose = onClose
  }

  private onGamepadButtonUp = (_gamepadIndex: number, buttonIndex: number) => {
    if (!this.isActive) return

    if (buttonIndex === 0) {
      this.show(false)
      if (this.onClose) this.onClose()
    }
  }
}
