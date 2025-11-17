import { buttonCircle } from '~/ui/button/circle'
import { iconSrc } from "~/ui/icons"
import { Localization } from '~/service/localization'
import { ConfirmationModal } from '~/ui/confirmation/confirm'
import { SettingsUI } from '~/ui/settings/settings'
import { GamepadService } from '~/service/gamepad'
import { inject } from '~/utils/inject'

import styles from './pause.module.css'
import modal from '~/ui/modal.module.css'
import layer from '~/ui/layers.module.css'

export class PauseModal {
  private loc: Localization
  private confirmationModal: ConfirmationModal
  private container: HTMLDivElement
  private inner: HTMLDivElement
  private pause: (_state: boolean) => void
  private restart: () => void
  private menu: () => void
  private gamepadService: GamepadService
  private settingsUI: SettingsUI
  private isActive = false

  constructor({ pause, restart, menu }: { pause: (_state: boolean) => void, restart: () => void, menu: () => void }) {
    this.pause = pause
    this.restart = restart
    this.menu = menu

    this.settingsUI = inject(SettingsUI)
    this.confirmationModal = inject(ConfirmationModal)
    this.gamepadService = inject(GamepadService)
    this.loc = inject(Localization)

    this.container = document.createElement('div')
    this.container.classList.add(layer.pause, styles.container)
    this.container.setAttribute('style', `display: none;`)

    const btnContinue = document.createElement('div')
    btnContinue.className = modal.button
    const continueLabel = document.createElement('span')
    this.loc.register('continue', continueLabel)
    const continueIcon = document.createElement('img')
    continueIcon.setAttribute('draggable', 'false')
    continueIcon.src = iconSrc.start
    btnContinue.append(continueIcon, continueLabel)
    btnContinue.addEventListener('click', this.handleResume)

    const btns = document.createElement('div')
    btns.className = modal.btns
    /*
    const btnResume = buttonCircle({ src: iconSrc.play })
    btnResume.addEventListener('click', this.handleResume)
    */
    const btnSettings = buttonCircle({ src: iconSrc.settings })
    btnSettings.addEventListener('click', this.handleSettings)

    const btnRestart = buttonCircle({ src: iconSrc.restart })
    btnRestart.addEventListener('click', this.handleRestart)

    const btnMenu = buttonCircle({ src: iconSrc.menu })
    btnMenu.addEventListener('click', this.handleMenu)

    btns.append(/* btnResume, */ btnRestart, btnSettings, btnMenu)

    this.inner = document.createElement('div')
    this.inner.append(btnContinue, btns)
    this.container.append(this.inner)

    this.container.addEventListener('click', event => {
      event.preventDefault()
      const { target, currentTarget } = event;
      if (target === currentTarget) {
        this.handleResume()
      }
    })
    this.gamepadService.registerCallbacks({ onButtonUp: this.onGamepadButtonUp })
  }

  public show = (state = true) => {
    if (state) {
      this.container.removeAttribute('style')
    } else {
      this.container.setAttribute('style', 'display: none')
    }
    this.inner.classList.toggle(modal.bounce, state)
    this.isActive = state
  }

  private onGamepadButtonUp = (_gamepadIndex: number, buttonIndex: number) => {
    if (!this.isActive) return

    if (buttonIndex === 9) {  // Start button
      this.handleMenu()
    }
    if (buttonIndex === 0 || buttonIndex === 1 || buttonIndex === 8) {  // Accept / Cancel button
      this.handleResume()
    }
  }

  private handleResume = () => {
    this.isActive = false
    this.show(false)
    this.pause(false)
  }

  private handleSettings = () => {
    this.settingsUI.show()
  }

  private handleRestart = () => {
    this.confirmationModal.show({
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
