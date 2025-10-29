import { Localization } from '~/service/localization'
import { GamepadService } from "~/service/gamepad"
import { buttonClose, buttonCircle } from "~/ui//button"
import { iconSrc } from '~/ui/icons'
import { inject, Injectable } from '~/utils/inject'

import styles from './confirm.module.css'
import modal from '~/ui/modal.module.css'
import layer from '~/ui/layers.module.css'


export class ConfirmationModalView {
  protected loc: Localization
  protected container: HTMLDivElement
  protected inner: HTMLDivElement
  protected message: HTMLParagraphElement
  protected button: { confirm: HTMLDivElement, cancel: HTMLDivElement }

  constructor() {
    this.loc = inject(Localization)
    this.container = document.createElement('div')
    this.container.classList.add(layer.confirmation, modal.outer)
    this.container.setAttribute('style', 'display: none;')

    const header = document.createElement('h3')
    this.loc.register('confirmation', header)
    this.inner = document.createElement('div')
    this.inner.classList.add(modal.inner, modal.small)
    const btnClose = buttonClose()
    btnClose.addEventListener('click', () => {
      this.container.setAttribute('style', 'display: none;')
    })
    this.message = document.createElement('p')

    const btns = document.createElement('div')
    btns.className = styles.btns
    this.button = {
      confirm: buttonCircle({ src: iconSrc.check }),
      cancel: buttonCircle({ src: iconSrc.close })
    }
    btns.append(this.button.confirm, this.button.cancel)

    this.inner.append(header, this.message, btns, btnClose)
    this.container.append(this.inner)
  }

  public get element() {
    return this.container
  }
}

@Injectable
export class ConfirmationModal extends ConfirmationModalView {
  private gamepadService: GamepadService
  private onClose?: () => void
  private acceptCallback?: () => void
  private isActive = false

  constructor() {
    super()
    this.gamepadService = inject(GamepadService)
    this.gamepadService.registerCallbacks({
      onButtonUp: this.onGamepadButtonUp
    })

    this.container.addEventListener('click', event => {
      const { target, currentTarget } = event;
      if (target === currentTarget) {
        this.handleCancel()
      }
    })

    this.button.confirm.addEventListener('click', this.handleAccept)
    this.button.cancel.addEventListener('click', this.handleCancel)
  }

  public registerCallback = (callbacks: { onClose?: () => void }) => {
    if (callbacks.onClose) this.onClose = callbacks.onClose
  }

  public show = ({ text, acceptCallback }: { text?: string, acceptCallback: () => void }) => {
    this.acceptCallback = acceptCallback
    this.message.innerText = text || this.loc.get('confirmationDefault')
    this.container.removeAttribute('style')
    this.inner.classList.add(modal.bounce)
    this.isActive = true
  }

  public hide = () => {
    this.container.setAttribute('style', 'display: none;')
    this.inner.classList.remove(modal.bounce)
    this.isActive = false
    if (this.onClose) this.onClose()
  }

  private handleAccept = () => {
    this.hide()
    if (this.acceptCallback) this.acceptCallback()
  }

  private handleCancel = () => {
    this.hide()
  }

  private onGamepadButtonUp = (_gamepadIndex: number, buttonIndex: number) => {
    if (!this.isActive) return

    if (buttonIndex === 1 || buttonIndex === 8) { // Accept
      this.handleAccept()
    }

    if (buttonIndex === 0) {  // Cancel
      this.handleCancel()
    }
  }
}
