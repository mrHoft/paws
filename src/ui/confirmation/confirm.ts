import { Localization } from '~/service/localization'
import { buttonClose, buttonCircle } from "~/ui//button"
import { iconSrc } from '../icons'

import styles from './confirm.module.css'

export class ConfirmationModal {
  private loc: Localization
  private container: HTMLDivElement
  private inner: HTMLDivElement
  private message: HTMLParagraphElement
  private acceptCallback?: () => void

  constructor() {
    this.loc = new Localization()
    this.container = document.createElement('div')
    this.container.className = styles.confirmation_layer

    const header = document.createElement('h3')
    // aHeader.innerText = 'Confirmation'
    this.loc.register('confirmation', header)
    this.inner = document.createElement('div')
    this.inner.className = styles.confirmation__inner
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
        event.preventDefault();
        this.handleCancel()
      }
    })

    btnConfirm.addEventListener('click', this.handleAccept)
    btnCancel.addEventListener('click', this.handleCancel)
  }

  public show = ({ text, acceptCallback }: { text?: string, acceptCallback: () => void }) => {
    this.acceptCallback = acceptCallback
    this.message.innerText = text || this.loc.get('confirmationDefault')
    this.container.setAttribute('style', 'display: flex;')
    this.inner.classList.add(styles.bounce)
  }

  public hide = () => {
    this.handleCancel()
  }

  private handleAccept = () => {
    this.container.setAttribute('style', 'display: none;')
    this.inner.classList.remove(styles.bounce)
    if (this.acceptCallback) this.acceptCallback()
  }

  private handleCancel = () => {
    this.container.setAttribute('style', 'display: none;')
    this.inner.classList.remove(styles.bounce)
  }

  public get element() {
    return this.container
  }
}
