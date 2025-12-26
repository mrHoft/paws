import { GENERAL } from "~/const"
import { Paws } from "./paws"

import styles from './loader.module.css'

type TMessageSource = 'assets' | 'api' | 'info'

export class LoaderUI {
  private container: HTMLDivElement
  private loaderBar: HTMLDivElement
  private loaderValue: HTMLDivElement
  private message: HTMLDivElement
  private paws: Paws
  private _errors = 0

  constructor() {
    this.container = document.createElement('div')
    this.container.classList.add(styles.loader)
    const progress = document.createElement('div')
    progress.classList.add(styles.loader__progress)
    this.loaderBar = document.createElement('div')
    this.loaderBar.classList.add(styles.loader__progress_bar)
    this.loaderValue = document.createElement('div')
    this.loaderValue.classList.add(styles.loader__progress_value)
    progress.append(this.loaderBar, this.loaderValue)

    this.message = document.createElement('div')
    this.message.classList.add(styles.loader__message)

    this.paws = new Paws()
    this.container.append(this.paws.element, progress, this.message)

  }

  public progressUpdate(progress: number) {
    this.loaderValue.innerText = `${progress}%`
    this.loaderBar.setAttribute('style', `width: ${progress}%;`)
  }

  public addMessage = ({ source }: { source: TMessageSource }) => ({ message, lapse = 0 }: { message: string, lapse?: number }) => {
    if (source !== 'info') this._errors += 1
    console.log(message, `(${lapse}ms)`)

    if (GENERAL.sdk !== 'yandex-games') {
      const msgEl = document.createElement('div')
      msgEl.innerText = message
      this.message.appendChild(msgEl)
    }
  }

  public get element() { return this.container }

  public get errors() { return this._errors }

  public destroy = () => {
    this.paws.destroy()
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.message.remove()
    this.loaderValue.remove()
    this.loaderBar.remove()
    this.container.remove()
  }
}
