import { circleButton } from '../circleButton/button'

import styles from './pause.module.css'

const icons = {
  resume: './icons/play.svg',
  restart: './icons/restart.svg',
  settings: './icons/settings.svg',
  menu: './icons/menu.svg',
}

export class PauseModal {
  private container: HTMLDivElement
  private pause: (_state: boolean) => void
  private restart: () => void
  private menu: () => void

  constructor({ pause, restart, menu }: { pause: (_state: boolean) => void, restart: () => void, menu: () => void }) {
    this.container = document.createElement('div')
    this.container.className = styles.pause_layer
    this.pause = pause
    this.restart = restart
    this.menu = menu

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
    const resume = circleButton(icons.resume)
    resume.addEventListener('click', this.handleResume)
    /*
    const settings = circleButton(icons.settings)
    settings.addEventListener('click', this.handleSettings)
     */
    const restart = circleButton(icons.restart)
    restart.addEventListener('click', this.handleRestart)
    const menu = circleButton(icons.menu)
    menu.addEventListener('click', this.handleMenu)
    btns.append(resume, restart, /* settings, */ menu)

    inner.append(h2, btns)
    this.container.append(inner)

    this.container.addEventListener('click', event => {
      const { target, currentTarget } = event;
      if (target === currentTarget) {
        event.preventDefault();
        this.handleResume()
      }
    })
  }

  private handleResume = () => {
    this.show(false)
    this.pause(false)
  }

  // private handleSettings = () => console.log('Handle settings')

  private handleRestart = () => {
    this.show(false)
    this.restart()
  }

  private handleMenu = () => {
    this.show(false)
    this.menu()
  }

  public get element() {
    return this.container
  }
}
