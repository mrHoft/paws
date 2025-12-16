import styles from './marker.module.css'

export class CountMarker {
  private container: HTMLElement

  constructor() {
    this.container = document.createElement('div')
    this.container.className = styles.marker
    this.container.innerText = '0'
    this.container.setAttribute('style', 'display: none;')
  }

  public set value(value: number) {
    this.container.innerText = `${value}`
    if (value) {
      this.container.removeAttribute('style')
    } else {
      this.container.setAttribute('style', 'display: none;')
    }
  }

  public get element() { return this.container }
}
