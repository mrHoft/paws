import { GAME, SCENE_NAMES, SCENE_TARGETS, ANIMALS, type TSceneName, type TAnimalName } from "~/const"
import { buttonCircle, buttonIcon, buttonClose } from "~/ui/button"
import { SettingsUI } from "~/ui/settings/settings"
import { AboutUI } from "~/ui/about/about"
import { UpgradeUI } from "~/ui/upgrade/upgrade"
import { iconSrc, spoilSrc } from "~/ui/icons"
import { Localization } from '~/service/localization'
import { ConfirmationModal } from "~/ui/confirmation/confirm"
import { MultiplayerMenu } from "~/ui/menu/multiplayer"
import { GamepadService } from '~/service/gamepad'
import { SoundService } from "~/service/sound"
import { inject } from "~/utils/inject"
import type { EngineOptions } from '~/engine/types'
import { InstallManager } from "~/service/installManager"
import { ProphecyStars } from "../stars/stars"
import { Storage } from "~/service/storage"

import styles from './main.module.css'
import modal from '~/ui/modal.module.css'
import layer from '~/ui/layers.module.css'

const PATH = './scene'

interface MenuItem { id: string, icon: string, func: () => void }

class MenuView {
  protected loc: Localization
  protected container: HTMLDivElement
  protected menu: HTMLDivElement
  protected menuItems: { element: HTMLDivElement, props: MenuItem, index: number }[] = []
  protected thumbs: { element: HTMLDivElement, thumb: HTMLDivElement, name: TSceneName, stars: ProphecyStars }[] = []
  protected scene: { element: HTMLDivElement, inner: HTMLDivElement, bg: HTMLDivElement, btn: HTMLDivElement, spoil: Record<string, HTMLImageElement>, name: TSceneName }
  protected gamepadSupport: HTMLDivElement
  protected stars: ProphecyStars
  protected isVisible = false
  protected isActive = false

  constructor() {
    this.loc = inject(Localization)
    this.stars = new ProphecyStars()

    this.container = document.createElement('div')
    this.container.classList.add(layer.menu, styles.container)
    this.container.setAttribute('style', `display: none;`)

    const levels = document.createElement('div')
    levels.className = styles.level_list
    const h = Math.floor(100 / (SCENE_NAMES.length - 1) * 2)
    levels.setAttribute('style', `height: ${100 - h * .75}%;`)

    const shift = Math.PI / 2 / (SCENE_NAMES.length - 1)
    for (let i = SCENE_NAMES.length - 1; i >= 0; i -= 1) {
      const element = document.createElement('div')
      element.classList.add(styles.level_list__el)
      const border = document.createElement('div')
      border.classList.add(modal.inner__border, modal.inner__mask)
      const name = SCENE_NAMES[i]
      const img = document.createElement('div')
      img.classList.add(modal.inner__bg, modal.inner__mask)
      img.setAttribute('style', `background-image: url(${PATH}/${name}.jpg);`)

      const stars = new ProphecyStars({ small: true })

      const r = Math.PI * 1 - i * shift
      const x = 50 + Math.floor(Math.cos(r) * 50)
      const y = Math.floor(Math.sin(r) * 100)
      element.setAttribute('style', `height: ${h}%; top: ${y}%; left: ${x}%;`)
      element.append(border, img, stars.element)
      this.thumbs.push({ element, thumb: img, name, stars })
      levels.append(element)
    }

    if (GAME.version) {
      const version = document.createElement('div')
      version.className = `${styles.version} text-shadow`
      version.innerText = GAME.version
      this.container.append(version)
    }

    this.menu = document.createElement('div')
    this.menu.className = styles.menu

    this.gamepadSupport = document.createElement('div')
    this.gamepadSupport.className = styles.gamepad_support
    const check = document.createElement('img')
    check.setAttribute('draggable', 'false')
    check.src = iconSrc.check
    check.alt = 'check'
    check.className = 'green'
    this.gamepadSupport.append(check)

    this.scene = this.sceneCreate()
    this.container.append(this.gamepadSupport, levels, this.menu, this.scene.element)
  }

  private sceneCreate = () => {
    const sceneContainer = document.createElement('div')
    sceneContainer.classList.add(layer.scene, modal.outer)
    sceneContainer.setAttribute('style', 'display: none;')

    const sceneInner = document.createElement('div')
    sceneInner.classList.add(modal.inner, styles.scene)
    const sceneBorder = document.createElement('div')
    sceneBorder.classList.add(modal.inner__border, modal.inner__mask)
    const sceneBg = document.createElement('div')
    sceneBg.classList.add(modal.inner__bg, modal.inner__mask, modal.inner__shadow)
    const sceneClose = buttonClose()
    sceneClose.addEventListener('click', () => {
      this.scene.element.setAttribute('style', 'display: none;')
    })

    const btn = buttonCircle({ src: iconSrc.play })

    const starsContainer = document.createElement('div')
    starsContainer.className = styles.scene__stars
    starsContainer.append(this.stars.element)

    const spoil: Record<string, HTMLImageElement> = {}
    const spoilContainer = document.createElement('div')
    spoilContainer.className = styles.scene__spoil
    ANIMALS.forEach(key => {
      let n = key.replace(/\d/, '')
      if (n === 'grasshopper') n = 'butterfly'
      if (!spoil[n]) {
        const icon = document.createElement('img')
        icon.setAttribute('draggable', 'false')
        icon.src = spoilSrc[n]
        icon.alt = n
        icon.width = icon.height = 40
        spoilContainer.append(icon)
        spoil[n] = icon
      }
    })

    sceneInner.append(sceneBorder, sceneBg, btn, starsContainer, spoilContainer, sceneClose)
    sceneContainer.append(sceneInner)
    return { element: sceneContainer, inner: sceneInner, bg: sceneBg, btn, spoil, name: ('default' as TSceneName) }
  }

  protected menuCreate(menuItems: MenuItem[]) {
    for (const props of menuItems) {
      const container = document.createElement('div')
      container.className = styles.menu__item

      const button = document.createElement('button')
      const icon = document.createElement('img')
      icon.setAttribute('draggable', 'false')
      icon.src = props.icon
      icon.alt = props.id
      const text = document.createElement('span')
      this.loc.register(props.id, text)
      button.append(icon, text)
      button.onclick = props.func

      const paw = document.createElement('img')
      paw.setAttribute('draggable', 'false')
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
    this.isVisible = state
    this.isActive = state
  }

  public get element() {
    return this.container
  }
}

export class MainMenu extends MenuView {
  private startSinglePlayerGame: (options?: EngineOptions) => void
  private confirmationModal: ConfirmationModal
  private gamepadService?: GamepadService
  private soundService: SoundService
  private storage: Storage
  private multiplayerMenu: MultiplayerMenu
  private selectedOptionIndex = 0
  private activeMenuItemId: string | null = null
  private settingsUI: SettingsUI
  private aboutUI: AboutUI
  private upgradeUI: UpgradeUI
  private deviceType: 'desktop' | 'android' | 'iOS'

  constructor({ startSinglePlayerGame }: { startSinglePlayerGame: (options?: EngineOptions) => void }) {
    super()
    this.startSinglePlayerGame = startSinglePlayerGame
    this.soundService = inject(SoundService)
    this.deviceType = inject(InstallManager).getDeviceType()
    this.storage = inject(Storage)

    const onClose = () => {
      if (this.isVisible) this.isActive = true
    }

    this.confirmationModal = inject(ConfirmationModal)
    this.confirmationModal.registerCallback({ onClose })
    this.multiplayerMenu = inject(MultiplayerMenu)
    this.multiplayerMenu.registerCallback({ onClose })
    this.gamepadService = inject(GamepadService)
    this.settingsUI = inject(SettingsUI)
    this.settingsUI.registerCallback({ onClose })
    this.aboutUI = inject(AboutUI)
    this.aboutUI.registerCallback({ onClose })
    this.upgradeUI = inject(UpgradeUI)
    this.upgradeUI.registerCallback({ onClose })

    this.menuInit()
    this.sceneInit()
    this.aboutInit()

    this.registerEvents();
  }

  private menuInit = () => {
    const menuItems: MenuItem[] = [
      { id: 'start', icon: iconSrc.start, func: () => { this.activeMenuItemId = 'start'; this.handleStart() } },
      { id: 'twoPlayers', icon: iconSrc.gamepad, func: () => { this.isActive = false; this.multiplayerMenu.show() } },
      { id: 'upgrade', icon: iconSrc.upgrade, func: () => { this.isActive = false; this.upgradeUI.show() } },
      { id: 'settings', icon: iconSrc.settings, func: () => { this.isActive = false; this.settingsUI.show() } },
    ]
    if (this.deviceType !== 'desktop') {
      const index = menuItems.findIndex(item => item.id === 'twoPlayers')
      if (index !== -1) {
        menuItems.splice(index, 1)
      }
    }
    this.menuCreate(menuItems)
    this.menuItems[0].element.classList.add(styles.hover)
  }

  private sceneInit = () => {
    for (const scene of this.thumbs) {
      const sceneData = this.storage.get<{ stars: number, score: number } | undefined>(`scene.${scene.name}`)
      scene.stars.setStars(sceneData?.stars || 0)
    }
  }

  public sceneUpdate = (name: string, count: number) => {
    for (const scene of this.thumbs) {
      if (scene.name === name) {
        scene.stars.setStars(count)
      }
    }
  }

  private aboutInit = () => {
    const btnAbout = buttonIcon({ src: iconSrc.about })
    btnAbout.classList.add(styles['top-right'])
    btnAbout.addEventListener('click', () => { this.isActive = false; this.aboutUI.show(true) })
    this.container.append(btnAbout)
  }

  private registerEvents = () => {
    this.thumbs.forEach(el => {
      el.element.addEventListener('click', this.handleSceneClick(el.name))
    })

    this.scene.btn.addEventListener('click', this.handleSceneStart)
    this.scene.element.addEventListener('click', this.handleOutsideClick)

    if (this.deviceType === 'desktop') {
      this.gamepadService?.registerCallbacks({
        onButtonUp: this.handleGamepadButton,
        onGamepadConnected: () => {
          this.gamepadSupport.classList.add(styles.active, modal.bounce)
        },
        onGamepadDisconnected: () => {
          this.gamepadSupport.classList.remove(styles.active, modal.bounce)
        }
      })
    } else {
      this.gamepadSupport.setAttribute('style', 'display: none;')
    }

    for (const item of this.menuItems) {
      item.element.addEventListener('mouseenter', () => {
        if (this.selectedOptionIndex !== item.index) {
          this.selectedOptionIndex = item.index
          this.handleOptionSelect()
        }
      })
    }
  }

  private handleGamepadButton = (_gamepadIndex: number, buttonIndex: number) => {
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
      if (!this.activeMenuItemId) {
        this.menuItems[this.selectedOptionIndex].props.func()
      } else {
        switch (this.activeMenuItemId) {
          case ('start'): {
            this.handleSceneStart()
            break
          }
          default: {
            console.log('activeMenuItem:', this.activeMenuItemId)
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
        default: {
          console.log('activeMenuItem:', this.activeMenuItemId)
        }
      }
      this.activeMenuItemId = null
    }
  }

  private handleOptionSelect = (silent = false) => {
    this.menuItems.forEach((item, i) => { item.element.classList.toggle(styles.hover, i === this.selectedOptionIndex) })
    if (!silent) this.soundService.play('tap')
  }

  private handleOutsideClick = (event: PointerEvent) => {
    event.preventDefault()
    const { target, currentTarget } = event;
    if (currentTarget && target === currentTarget) {
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

  private handleSceneClick = (name: TSceneName) => (event?: PointerEvent) => {
    if (event) {
      const element = event.currentTarget as HTMLElement;
      element.style.pointerEvents = 'none'
      void element.offsetHeight
      setTimeout(() => { element.style.pointerEvents = '' }, 0);
    }

    this.scene.name = name
    this.scene.element.setAttribute('style', 'display: flex;')
    this.scene.bg.setAttribute('style', `background-image: url(${PATH}/${name}.jpg)`)
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

    const sceneData = this.storage.get<{ stars: number, score: number } | undefined>(`scene.${name}`)
    console.log(name, sceneData)
    const stars = sceneData?.stars || 0
    this.stars.setStars(stars)
  }

  private handleSceneStart = () => {
    this.show(false)
    this.scene.element.setAttribute('style', 'display: none;')
    this.startSinglePlayerGame({ sceneName: this.scene.name })
  }
}
