import { buttonCircle } from '~/ui/button/circle'
import { iconSrc } from "~/ui/icons"
import { Localization } from '~/service/localization'
import { ConfirmationModal } from '../confirmation/confirm'
import { GamepadService } from '~/service/gamepad'
import { inject } from '~/utils/inject'

import styles from './pause.module.css'

export class PauseModal {
  private loc: Localization
  private confirm?: ConfirmationModal
  private container: HTMLDivElement
  private inner: HTMLDivElement
  private pause: (_state: boolean) => void
  private restart: () => void
  private menu: () => void
  private gamepadService!: GamepadService
  private pauseActive = false

  constructor({ pause, restart, menu, confirm }: { pause: (_state: boolean) => void, restart: () => void, menu: () => void, confirm?: ConfirmationModal }) {
    this.gamepadService = inject(GamepadService)
    this.loc = new Localization()
    this.confirm = confirm
    this.container = document.createElement('div')
    this.container.className = styles.pause_layer
    this.pause = pause
    this.restart = restart
    this.menu = menu

    this.inner = document.createElement('div')
    this.inner.className = styles.pause__inner
    const h2 = document.createElement('h2')
    h2.className = styles.pause__header
    // h2.textContent = 'Pause'
    this.loc.register('pause', h2)

    const btns = document.createElement('div')
    btns.className = styles.pause__btns
    const btnResume = buttonCircle({ src: iconSrc.resume })
    btnResume.addEventListener('click', this.handleResume)
    /*
    const btnSettings = buttonCircle({src: icons.settings})
    btnSettings.addEventListener('click', this.handleSettings)
     */
    const btnRestart = buttonCircle({ src: iconSrc.restart })
    btnRestart.addEventListener('click', this.handleRestart)
    const btnMenu = buttonCircle({ src: iconSrc.menu })
    btnMenu.addEventListener('click', this.handleMenu)
    btns.append(btnResume, btnRestart, /* btnSettings, */ btnMenu)

    this.inner.append(h2, btns)
    this.container.append(this.inner)

    this.container.addEventListener('click', event => {
      const { target, currentTarget } = event;
      if (target === currentTarget) {
        event.preventDefault();
        this.handleResume()
      }
    })
    this.gamepadService.registerCallbacks({ onButtonUp: this.onGamepadButtonUp })
  }

  public show = (state: boolean) => {
    this.container.setAttribute('style', state ? 'display: flex;' : 'display: none;')
    this.inner.classList.toggle(styles.bounce, state)
    this.pauseActive = state
  }

  private onGamepadButtonUp = (_gamepadIndex: number, buttonIndex: number) => {
    if (!this.pauseActive) return

    if (buttonIndex === 9) {  // Start button
      this.handleMenu()
    }
    if (buttonIndex === 0 || buttonIndex === 1 || buttonIndex === 8) {  // Accept / Cancel button
      this.handleResume()
    }
  }

  private handleResume = () => {
    this.show(false)
    this.pause(false)
  }

  // private handleSettings = () => console.log('Handle settings')

  private handleRestart = () => {
    this.confirm?.show({
      text: this.loc.get('restartDesc'), acceptCallback: () => {
        this.show(false)
        this.restart()
      }
    })
  }

  private handleMenu = () => {
    this.show(false)
    this.menu()
  }

  public get element() {
    return this.container
  }
}
