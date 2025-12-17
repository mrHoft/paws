import { Injectable } from '~/utils/inject';

import styles from './message.module.css'

@Injectable
export class Message {
  private container: HTMLElement
  private messages: { id: number, element: HTMLElement }[] = []

  constructor() {
    this.container = document.createElement('div')
    this.container.className = styles.messages
  }

  public show(children: string | HTMLElement | DocumentFragment, mode: 'blank' | 'regular' | 'error' = 'regular') {
    const id = Date.now()
    const element = document.createElement('div')
    element.className = styles.messages__item
    if (mode !== 'blank') {
      const icon = document.createElement('div')
      icon.className = styles.messages__item_icon
      icon.textContent = mode === 'error' ? '\u274C' : '\u2714'
      element.appendChild(icon)
    }

    const content = typeof children === 'string' ? document.createTextNode(children) : children
    element.appendChild(content)

    this.container.appendChild(element)
    this.messages.push({ id, element })

    setTimeout(() => {
      const message = this.messages.find(m => m.id === id)
      if (message) {
        message.element.classList.add('hidden')
      }

      setTimeout(() => {
        const finalIndex = this.messages.findIndex(m => m.id === id)
        if (finalIndex !== -1) {
          const { element } = this.messages[finalIndex]
          if (element.parentNode) {
            element.parentNode.removeChild(element)
          }
          this.messages.splice(finalIndex, 1)
        }
      }, 500)
    }, 3000)
  }

  public get element() { return this.container }
}
