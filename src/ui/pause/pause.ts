import styles from './pause.module.css'

const icons = {
  resume: '/icons/play.svg',
  restart: '/icons/restart.svg',
  settings: '/icons/settings.svg',
}

export class PauseModal {
  private container: HTMLDivElement
  private pause: (_state: boolean) => void
  private restart: () => void

  constructor({ pause, restart }: { pause: (_state: boolean) => void, restart: () => void }) {
    this.container = document.createElement('div')
    this.container.className = styles.pause
    this.pause = pause
    this.restart = restart

    this.init()
  }

  public show = (state: boolean) => {
    this.container.setAttribute('style', state ? 'display: flex;' : 'display: none;')
  }

  private init = () => {
    const inner = document.createElement('div')
    inner.className = styles.pause__inner
    const h2 = document.createElement('h2')
    h2.className = styles.pause__header
    h2.textContent = 'Pause'

    const btns = document.createElement('div')
    btns.className = styles.pause__btns
    const resume = this.createButton(icons.resume)
    resume.addEventListener('click', this.handlePause)
    const settings = this.createButton(icons.settings)
    settings.addEventListener('click', this.handleSettings)
    const restart = this.createButton(icons.restart)
    restart.addEventListener('click', this.handleRestart)
    btns.append(resume, restart, settings)

    inner.append(h2, btns)
    this.container.append(inner)
  }

  private handlePause = () => {
    this.show(false)
    this.pause(false)
  }

  private handleSettings = () => console.log('Handle settings')

  private handleRestart = () => {
    this.show(false)
    this.restart()
  }

  private createButton = (src: string) => {
    const btn = document.createElement('div')
    btn.className = styles.btn
    const img = document.createElement('img')
    img.src = src
    btn.append(img)
    return btn
  }

  public get element() {
    return this.container
  }
}
