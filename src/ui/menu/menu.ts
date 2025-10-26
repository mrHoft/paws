import { GAME, SCENE_NAMES, SCENE_TARGETS, ANIMALS, type TSceneName, type TAnimalName } from "~/const"
import { buttonCircle, buttonIcon, buttonClose } from "~/ui/button"
import { SettingsUI } from "~/ui/settings/settings"
import { AboutUI } from "~/ui/about/about"
import { iconSrc, spoilSrc } from "~/ui/icons"
import { Localization } from '~/service/localization'
import { ConfirmationModal } from "~/ui/confirmation/confirm"
import { SinglePlayerUI } from "../game-ui/singlePlayer"
import { TwoPlayers } from "~/ui/two-players/twoPlayers"
import { GamepadService } from '~/service/gamepad'
import { Storage } from "~/service/storage"
import { inject } from "~/utils/inject"
import type { EngineOptions } from '~/engine/types'

import styles from './menu.module.css'
import modal from '~/ui/modal.module.css'
import layer from '~/ui/layers.module.css'

const PATH = './thumb'

interface MenuItem { id: string, icon: string, func: () => void }

class MenuView {
  protected loc: Localization
  protected container: HTMLDivElement
  protected menu: HTMLDivElement
  protected menuItems: { element: HTMLDivElement, props: MenuItem, index: number }[] = []
  protected thumbs: { img: HTMLImageElement, name: TSceneName }[] = []
  protected scene: { element: HTMLDivElement, inner: HTMLDivElement, btn: HTMLDivElement, spoil: Record<string, HTMLImageElement>, name: TSceneName }
  protected gamepadSupport: HTMLDivElement
  protected isActive = false

  constructor() {
    this.loc = inject(Localization)
    this.container = document.createElement('div')
    this.container.classList.add(layer.menu, styles.container)
    this.container.setAttribute('style', `display: none;`)

    const level = document.createElement('div')
    level.className = styles.level
    const h = Math.floor(100 / (SCENE_NAMES.length - 1) * 2)
    level.setAttribute('style', `height: ${100 - h * .75}%;`)

    const shift = Math.PI / 2 / (SCENE_NAMES.length - 1)
    for (let i = SCENE_NAMES.length - 1; i >= 0; i -= 1) {
      const name = SCENE_NAMES[i]
      const img = document.createElement('img')
      img.className = styles.level__thumb
      img.src = `${PATH}/${name}.jpg`

      const r = Math.PI * 1 - i * shift
      const x = 50 + Math.floor(Math.cos(r) * 50)
      const y = Math.floor(Math.sin(r) * 100)
      img.setAttribute('style', `height: ${h}%; top: ${y}%; left: ${x}%;`)
      this.thumbs.push({ img, name })
      level.append(img)
    }

    const version = document.createElement('div')
    version.className = `${styles.version} text-shadow`
    version.innerText = GAME.version

    this.menu = document.createElement('div')
    this.menu.className = styles.menu

    this.gamepadSupport = document.createElement('div')
    this.gamepadSupport.className = styles.gamepad_support
    const check = document.createElement('img')
    check.src = iconSrc.check
    check.alt = 'check'
    check.className = 'green'
    this.gamepadSupport.append(check)

    this.scene = this.sceneCreate()
    this.container.append(version, this.gamepadSupport, level, this.menu, this.scene.element)
  }

  private sceneCreate = () => {
    const sceneContainer = document.createElement('div')
    sceneContainer.classList.add(layer.scene, modal.outer)
    sceneContainer.setAttribute('style', 'display: none;')

    const sceneInner = document.createElement('div')
    sceneInner.classList.add(modal.inner, styles.scene)
    const sceneClose = buttonClose()
    sceneClose.addEventListener('click', () => {
      this.scene.element.setAttribute('style', 'display: none;')
    })

    const btn = buttonCircle({ src: iconSrc.play })

    const spoil: Record<string, HTMLImageElement> = {}
    const spoilContainer = document.createElement('div')
    spoilContainer.className = styles.scene__spoil
    ANIMALS.forEach(key => {
      let n = key.replace(/\d/, '')
      if (n === 'grasshopper') n = 'butterfly'
      if (!spoil[n]) {
        const icon = document.createElement('img')
        icon.src = spoilSrc[n]
        icon.alt = n
        icon.width = icon.height = 40
        spoilContainer.append(icon)
        spoil[n] = icon
      }
    })

    sceneInner.append(btn, spoilContainer, sceneClose)
    sceneContainer.append(sceneInner)
    return { element: sceneContainer, inner: sceneInner, btn, spoil, name: ('default' as TSceneName) }
  }

  protected menuCreate(menuItems: MenuItem[]) {
    for (const props of menuItems) {
      const container = document.createElement('div')
      container.className = styles.menu__item

      const button = document.createElement('button')
      const icon = document.createElement('img')
      icon.src = props.icon
      icon.alt = props.id
      const text = document.createElement('span')
      this.loc.register(props.id, text)
      button.append(icon, text)
      button.onclick = props.func

      const paw = document.createElement('img')
      paw.src = iconSrc.paw
      paw.className = styles.paw

      container.append(paw, button)
      this.menuItems.push({ element: container, props, index: this.menuItems.length })
      this.menu.append(container)
    }
  }

  public show = (state = true) => {
    if (state) {
      this.container.removeAttribute('style')
    } else {
      this.container.setAttribute('style', 'display: none')
    }
    this.isActive = state
  }

  public get element() {
    return this.container
  }
}

export class MenuUI extends MenuView {
  private startSinglePlayerGame: (options?: EngineOptions) => void
  private storage: Storage
  private confirmationModal: ConfirmationModal
  private gamepadService?: GamepadService
  private twoPlayersUI: TwoPlayers
  private selectedMenuItemIndex = 0
  private activeMenuItemId: string | null = null
  private settingsUI: SettingsUI
  private aboutUI: AboutUI
  private singlePlayerUI: SinglePlayerUI

  constructor({ startSinglePlayerGame, confirmationModal }: { startSinglePlayerGame: (options?: EngineOptions) => void, confirmationModal: ConfirmationModal }) {
    super()
    this.startSinglePlayerGame = startSinglePlayerGame
    this.confirmationModal = confirmationModal

    const onClose = () => { this.isActive = true }
    this.storage = inject(Storage)
    this.singlePlayerUI = inject(SinglePlayerUI)
    this.twoPlayersUI = inject(TwoPlayers)
    this.twoPlayersUI.registerCallback({ onClose })
    this.gamepadService = inject(GamepadService)
    this.settingsUI = inject(SettingsUI)
    this.settingsUI.registerCallback({ onClose })
    this.aboutUI = inject(AboutUI)
    this.aboutUI.registerCallback({ onClose })

    this.menuCreate([
      { id: 'start', icon: iconSrc.play, func: () => { this.activeMenuItemId = 'start'; this.handleStart() } },
      { id: 'twoPlayers', icon: iconSrc.gamepad, func: () => { this.isActive = false; this.twoPlayersUI.show(true) } },
      { id: 'restart', icon: iconSrc.restart, func: () => { this.activeMenuItemId = 'restart'; this.handleRestart() } },
      { id: 'settings', icon: iconSrc.settings, func: () => { this.isActive = false; this.settingsUI.show(true) } },
      // { id: 'about', icon: iconSrc.about, func: this.handleAbout },
    ])
    this.menuItems[0].element.classList.add(styles.hover)

    const btnAbout = buttonIcon({ src: iconSrc.about })
    btnAbout.classList.add(styles['top-right'])
    btnAbout.addEventListener('click', () => { this.isActive = false; this.aboutUI.show(true) })
    this.container.append(this.settingsUI.element, btnAbout)

    this.registerEvents();
  }

  private registerEvents = () => {
    this.thumbs.forEach(el => {
      el.img.addEventListener('click', this.handleSceneClick(el.name))
    })

    this.scene.btn.addEventListener('click', this.handleSceneStart)
    this.scene.element.addEventListener('click', this.handleOutsideClick)

    this.gamepadService?.registerCallbacks({ onButtonUp: this.handleGamepadButton, onGamepadConnected: this.handleGamepadConnected })

    for (const item of this.menuItems) {
      item.element.addEventListener('mouseenter', () => {
        this.selectedMenuItemIndex = item.index
        this.menuItems.forEach(({ element }, i) => { element.classList.toggle(styles.hover, i === item.index) })
      })
    }
  }

  private handleGamepadConnected = () => {
    this.gamepadSupport.classList.add(styles.active, modal.bounce)
  }

  private handleGamepadButton = (_gamepadIndex: number, buttonIndex: number) => {
    if (!this.isActive) return

    if (buttonIndex === 12 || buttonIndex === 13) {
      if (buttonIndex === 12) {
        this.selectedMenuItemIndex = this.selectedMenuItemIndex > 0 ? this.selectedMenuItemIndex - 1 : 0
      }
      if (buttonIndex === 13) {
        this.selectedMenuItemIndex = this.selectedMenuItemIndex < this.menuItems.length - 1 ? this.selectedMenuItemIndex + 1 : this.menuItems.length - 1
      }
      this.menuItems.forEach((item, i) => { item.element.classList.toggle(styles.hover, i === this.selectedMenuItemIndex) })
    }
    if (buttonIndex === 1 || buttonIndex === 8) { // Accept
      if (!this.activeMenuItemId) {
        this.menuItems[this.selectedMenuItemIndex].props.func()
      } else {
        switch (this.activeMenuItemId) {
          case ('start'): {
            this.handleSceneStart()
            break
          }
          case ('restart'): {
            this.handleStart()
            break
          }
          case ('confirmation'): {
            this.confirmationModal.hide()
            this.startSinglePlayerGame({ sceneName: SCENE_NAMES[0], restart: true })
            break
          }
          default: {
            console.log(this.activeMenuItemId)
          }
        }
        this.activeMenuItemId = null
      }
    }
    if (buttonIndex === 0) {  // Cancel
      switch (this.activeMenuItemId) {
        case ('start'): {
          this.scene.element.setAttribute('style', 'display: none;')
          break
        }
        case ('twoPlayers'): {
          this.twoPlayersUI.hide()
          break
        }
        case ('restart'): {
          this.confirmationModal.hide()
          break
        }
        case ('confirmation'): {
          this.confirmationModal.hide()
          break
        }
        default: {
          console.log(this.activeMenuItemId)
        }
      }
      this.activeMenuItemId = null
    }
  }

  private handleOutsideClick = (event: PointerEvent) => {
    const { target, currentTarget } = event;
    if (currentTarget && target === currentTarget) {
      event.preventDefault();
      const element = currentTarget as HTMLDivElement
      element.setAttribute('style', 'display: none;')
      for (const child of element.children) {
        child.classList.remove(modal.bounce)
      }
    }
  }

  private handleStart = () => {
    const name = SCENE_NAMES[Math.floor(Math.random() * SCENE_NAMES.length)]
    this.handleSceneClick(name)()
  }

  private handleRestart = () => {
    this.activeMenuItemId = 'confirmation'
    this.confirmationModal.show({
      text: this.loc.get('restartDesc'),
      acceptCallback: () => {
        this.startSinglePlayerGame({ sceneName: SCENE_NAMES[0], restart: true })
        this.singlePlayerUI?.caught.handleReset()
      }
    })
  }

  private handleSceneClick = (name: TSceneName) => (event?: PointerEvent) => {
    if (event) {
      const element = event.currentTarget as HTMLElement;
      element.style.pointerEvents = 'none'
      void element.offsetHeight
      setTimeout(() => { element.style.pointerEvents = '' }, 0);
    }

    this.scene.name = name
    this.scene.element.setAttribute('style', 'display: flex;')
    this.scene.inner.setAttribute('style', `background-image: url(${PATH}/${name}.jpg)`)
    this.scene.inner.classList.add(modal.bounce)

    const spoil: string[] = SCENE_TARGETS[name]
      .filter(el => ANIMALS.includes(el as TAnimalName))
      .map(name => {
        let n = name.replace(/\d/, '')
        if (n === 'grasshopper') n = 'butterfly'
        return n
      })

    for (const key of ANIMALS) {
      let n = key.replace(/\d/, '')
      const el = this.scene.spoil[n]
      if (el) {
        const visible = spoil.includes(el.alt)
        el.setAttribute('style', `display: ${visible ? 'block' : 'none'}`)
      }
    }
  }

  private handleSceneStart = () => {
    this.show(false)
    this.scene.element.setAttribute('style', 'display: none;')
    const initialScore = this.storage.get<number>('data.score')
    this.startSinglePlayerGame({ sceneName: this.scene.name, initialScore })
  }
}
