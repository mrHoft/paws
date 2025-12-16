import styles from './copy.module.css'

export class CopyLink {
  private container: HTMLElement
  private msg: HTMLElement
  private timer?: number

  constructor({ text, link }: { text: string, link: string }) {
    this.msg = document.createElement('span')
    this.msg.innerText = 'Copied'
    this.msg.className = styles.copy_link__msg

    this.container = document.createElement('a')
    this.container.className = styles.copy_link
    this.container.innerText = text
    this.container.append(this.msg)

    this.container.addEventListener('click', event => {
      event.preventDefault()
      this.handleCopy(link)
    })
  }

  private handleCopy(link: string) {
    navigator.clipboard.writeText(link)
    this.msg.classList.add(styles.show)
    if (this.timer) clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      this.msg.classList.remove(styles.show)
    }, 3000)
  }

  public get element() { return this.container }
}
