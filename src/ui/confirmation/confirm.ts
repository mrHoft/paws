import { Localization } from '~/service/localization'
import { buttonClose, buttonCircle } from "~/ui//button"
import { iconSrc } from '~/ui/icons'
import { inject, Injectable } from '~/utils/inject'

import styles from './confirm.module.css'
import modal from '~/ui/modal.module.css'
import layer from '~/ui/layers.module.css'

@Injectable
export class ConfirmationModal {
  private loc: Localization
  private container: HTMLDivElement
  private inner: HTMLDivElement
  private message: HTMLParagraphElement
  private acceptCallback?: () => void

  constructor() {
    this.loc = inject(Localization)
    this.container = document.createElement('div')
    this.container.classList.add(layer.confirmation, modal.outer)
    this.container.setAttribute('style', 'display: none;')

    const header = document.createElement('h3')
    this.loc.register('confirmation', header)
    this.inner = document.createElement('div')
    this.inner.className = modal.inner
    const btnClose = buttonClose()
    btnClose.addEventListener('click', () => {
      this.container.setAttribute('style', 'display: none;')
    })
    this.message = document.createElement('p')

    const btns = document.createElement('div')
    btns.className = styles.btns
    const btnConfirm = buttonCircle({ src: iconSrc.check })
    const btnCancel = buttonCircle({ src: iconSrc.close })
    btns.append(btnConfirm, btnCancel)

    this.inner.append(header, this.message, btns, btnClose)
    this.container.append(this.inner)

    this.container.addEventListener('click', event => {
      const { target, currentTarget } = event;
      if (target === currentTarget) {
        this.handleCancel()
      }
    })

    btnConfirm.addEventListener('click', this.handleAccept)
    btnCancel.addEventListener('click', this.handleCancel)
  }

  public show = ({ text, acceptCallback }: { text?: string, acceptCallback: () => void }) => {
    this.acceptCallback = acceptCallback
    this.message.innerText = text || this.loc.get('confirmationDefault')
    this.container.removeAttribute('style')
    this.inner.classList.add(modal.bounce)
  }

  public hide = () => {
    this.handleCancel()
  }

  private handleAccept = () => {
    this.container.setAttribute('style', 'display: none;')
    this.inner.classList.remove(modal.bounce)
    if (this.acceptCallback) this.acceptCallback()
  }

  private handleCancel = () => {
    this.container.setAttribute('style', 'display: none;')
    this.inner.classList.remove(modal.bounce)
  }

  public get element() {
    return this.container
  }
}
