import { Paws } from "./paws"

import styles from './loader.module.css'

export class LoaderUI {
  private container: HTMLDivElement
  private loaderBar: HTMLDivElement
  private loaderValue: HTMLDivElement
  private message: HTMLDivElement
  private paws: Paws

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

  public addMessage = (msgEl: HTMLElement) => {
    this.message.appendChild(msgEl)
  }

  public get element() {
    return this.container
  }

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
