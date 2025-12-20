import { buttonClose } from "~/ui/button"
import { Localization } from '~/service/localization'
import { GamepadService } from "~/service/gamepad"
import { Injectable, inject } from "~/utils/inject"
import { iconSrc } from "~/ui/icons"
import { CopyLink } from "../copy-link/copy"

import modal from '~/ui/modal.module.css'
import layer from '~/ui/layers.module.css'

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

    const border = document.createElement('div')
    border.classList.add(modal.inner__border, modal.inner__mask)
    const bg = document.createElement('div')
    bg.classList.add(modal.inner__bg, modal.inner__mask, modal.inner__shadow)

    this.inner = document.createElement('div')
    this.inner.className = modal.inner

    const h3 = document.createElement('h3')
    this.loc.register('about', h3)
    const icon = document.createElement('div')
    icon.className = modal.icon
    icon.setAttribute('style', `mask-image: url(${iconSrc.about});`)
    icon.setAttribute('style', `-webkit-mask-image: url(${iconSrc.about});`)
    const header = document.createElement('div')
    header.className = modal.header
    header.append(icon, h3)

    const content = document.createElement('div')
    content.className = modal.inner__content
    content.append(header, ...this.createContent())

    this.close = buttonClose()

    this.inner.append(border, bg, content, this.close)
    this.container.append(this.inner)
  }

  private createContent() {
    const link = new CopyLink({ text: 'mrHoft', link: 'mrHoft@yandex.ru' }).element

    const author = document.createElement('p')
    const text = document.createElement('span')
    this.loc.register('developed', text)
    author.append(text, '\u00a0', link)

    const copyright = document.createElement('div')
    copyright.innerText = '© 2025'

    return [author, copyright]
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
      event.preventDefault()
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
