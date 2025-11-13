import { SCENE_NAMES } from "~/const"
import { buttonClose } from "~/ui/button"
import { Localization } from '~/service/localization'
import { GamepadService } from "~/service/gamepad"
import { SoundService } from "~/service/sound"
import { Injectable, inject } from "~/utils/inject"
import { iconSrc } from "../icons"
import type { TControl, EngineOptions } from "~/engine/types"

import styles from './multiplayer.module.css'
import modal from '~/ui/modal.module.css'
import layer from '~/ui/layers.module.css'

const deviceItems: TControl[][] = [
  ['pointer', 'keyboard'],
  ['pointer', 'gamepad1'],
  ['gamepad1', 'gamepad2']
]

class MenuMultiplayerView {
  protected loc: Localization
  protected container: HTMLDivElement
  protected inner: HTMLDivElement
  protected close: HTMLDivElement
  protected menuItems: { element: HTMLDivElement, controls: TControl[], index: number }[] = []
  protected gamepads: { gamepad1: HTMLDivElement[], gamepad2: HTMLDivElement[] } = { gamepad1: [], gamepad2: [] }
  protected isActive = false

  constructor() {
    this.loc = inject(Localization)
    this.container = document.createElement('div')
    this.container.classList.add(layer.two_players, modal.outer)
    this.container.setAttribute('style', 'display: none;')

    const border = document.createElement('div')
    border.classList.add(modal.inner__border, modal.inner__mask)
    const bg = document.createElement('div')
    bg.classList.add(modal.inner__bg, modal.inner__mask, modal.inner__shadow)

    this.inner = document.createElement('div')
    this.inner.className = modal.inner

    const header = document.createElement('h3')
    this.loc.register('twoPlayers', header)

    const message = document.createElement('p')
    message.className = 'text-center'
    message.setAttribute('style', 'font-size: smaller;')
    this.loc.register('connectGamepad', message)

    const menu = document.createElement('div')
    menu.className = styles.menu
    deviceItems.forEach((controls, index) => {
      const element = document.createElement('div')
      element.className = styles.item
      const paw = document.createElement('img')
      paw.setAttribute('draggable', 'false')
      paw.className = styles.paw
      paw.src = iconSrc.paw
      const row = document.createElement('div')
      row.className = styles.row
      controls.forEach((control, i) => row.append(this.createDevice(control, i)))
      element.append(paw, row)
      menu.append(element)
      this.menuItems.push({ element, controls, index })
    })

    this.close = buttonClose()

    const content = document.createElement('div')
    content.className = modal.inner__content
    content.append(header, menu, message)

    this.inner.append(border, bg, content, this.close)
    this.container.append(this.inner)
  }

  private createDevice = (control: TControl, i: number) => {
    const device = document.createElement('div')
    device.classList.add(styles.device)
    const img = document.createElement('img')
    img.setAttribute('draggable', 'false')
    img.src = iconSrc[control.replace(/\d/, '')]
    const player = document.createElement('span')
    player.className = 'text-shadow'
    player.innerText = `P${i + 1}`
    device.append(img, player)
    if (control === 'gamepad1' || control === 'gamepad2') {
      this.gamepads[control].push(device)
    } else {
      device.classList.add(styles.active)
    }

    return device
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

  public hide = () => {
    this.show(false)
  }

  protected setGamepadActive = (index: number) => {
    const controls: ('gamepad1' | 'gamepad2')[] = ['gamepad1', 'gamepad2']
    for (const control of controls) {
      const arr = this.gamepads[control]
      for (const el of arr) {
        const gamepadIndex = (Number(control.slice(-1)) || 0)
        el.classList.toggle(styles.active, index >= gamepadIndex)
      }
    }
  }

  protected shakeGamepad = (control: 'gamepad1' | 'gamepad2') => {
    const arr = this.gamepads[control]
    for (const el of arr) {
      el.classList.add(styles.shake)
      setTimeout(() => {
        el.classList.remove(styles.shake)
      }, 300)
    }
  }

  public get element() {
    return this.container
  }
}

@Injectable
export class MultiplayerMenu extends MenuMultiplayerView {
  private gamepadService: GamepadService
  private soundService: SoundService
  private onClose?: () => void
  private startMultiplayerGame: (options1: EngineOptions, options2: EngineOptions) => void
  private selectedOptionIndex = 0

  constructor({ startMultiplayerGame }: { startMultiplayerGame: (options1: EngineOptions, options2: EngineOptions) => void }) {
    super()
    this.startMultiplayerGame = startMultiplayerGame
    this.soundService = inject(SoundService)
    this.gamepadService = inject(GamepadService)
    this.gamepadService.registerCallbacks({
      onGamepadConnected: this.handleGamepadConnected,
      onGamepadDisconnected: this.handleGamepadConnected,
      onButtonUp: this.onGamepadButtonUp
    })

    this.menuItems[0].element.classList.add(styles.hover)

    for (const item of this.menuItems) {
      item.element.addEventListener('mouseenter', () => {
        if (this.selectedOptionIndex !== item.index) {
          this.selectedOptionIndex = item.index
          this.handleOptionSelect()
        }
      })
      item.element.addEventListener('click', this.handleStart)
    }

    this.container.addEventListener('click', event => {
      event.preventDefault()
      const { target, currentTarget } = event;
      if (target === currentTarget) {
        this.show(false)
        if (this.onClose) this.onClose()
      }
    })

    this.close.addEventListener('click', () => {
      this.show(false)
      if (this.onClose) this.onClose()
    })
  }

  public registerCallback = (callbacks: { onClose?: () => void }) => {
    if (callbacks.onClose) this.onClose = callbacks.onClose
  }

  private handleStart = () => {
    const { controls } = this.menuItems[this.selectedOptionIndex]
    let ready = true
    for (const control of controls) {
      if (control === 'gamepad1' || control === 'gamepad2') {
        const index = Number(control.slice(-1))
        if (!this.gamepadService.isGamepadConnected(index - 1)) {
          ready = false
          this.shakeGamepad(control)
        }
      }
    }

    if (ready) {
      this.show(false)
      if (this.onClose) this.onClose()

      const sceneName = SCENE_NAMES[Math.floor(Math.random() * SCENE_NAMES.length)]
      this.startMultiplayerGame(
        { sceneName, multiplayer: 'top', control: controls[0] },
        { sceneName, multiplayer: 'bottom', control: controls[1] }
      )
    } else {
      this.soundService.play('error')
    }
  }

  private onGamepadButtonUp = (_gamepadIndex: number, buttonIndex: number) => {
    if (!this.isActive) return

    if (buttonIndex === 12 || buttonIndex === 13) {
      if (buttonIndex === 12) {
        this.selectedOptionIndex = this.selectedOptionIndex > 0 ? this.selectedOptionIndex - 1 : 0
      }
      if (buttonIndex === 13) {
        this.selectedOptionIndex = this.selectedOptionIndex < this.menuItems.length - 1 ? this.selectedOptionIndex + 1 : this.menuItems.length - 1
      }

      this.handleOptionSelect()
    }

    if (buttonIndex === 1 || buttonIndex === 8) { // Accept
      this.handleStart()
    }

    if (buttonIndex === 0) {  // Cancel
      this.show(false)
      if (this.onClose) this.onClose()
    }
  }

  private handleGamepadConnected = () => {
    const total = this.gamepadService.gamepadCount
    console.log('Gamepads:', total)
    this.setGamepadActive(Math.min(total, 2))
  }

  private handleOptionSelect = (silent = false) => {
    this.menuItems.forEach((item, i) => { item.element.classList.toggle(styles.hover, i === this.selectedOptionIndex) })
    if (!silent) this.soundService.play('tap')
  }
}
