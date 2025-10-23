import { GAME, SCENE_NAMES, SCENE_TARGETS, ANIMALS, type TSceneName, type TAnimalName } from "~/const"
import { buttonCircle, buttonIcon, buttonClose } from "~/ui/button"
import { about } from "~/ui/about/about"
import { Settings } from "~/ui/settings/settings"
import { iconSrc, spoilSrc } from "~/ui/icons"
import { Localization } from '~/service/localization'
import { ConfirmationModal } from "~/ui/confirmation/confirm"
import { TwoPlayers } from "~/ui/twoPlayers/twoPlayers"
import { GamepadService } from '~/service/gamepad'
import { inject } from "~/utils/inject"

import styles from './menu.module.css'

const PATH = './thumb'

interface MenuItem { id: string, icon: string, func: () => void }

class MenuView {
  protected loc: Localization
  protected container: HTMLDivElement
  protected menu: HTMLDivElement
  protected menuItems: { element: HTMLDivElement, props: MenuItem, index: number }[] = []
  protected about: HTMLDivElement
  protected settings: { element: HTMLDivElement, inner: HTMLDivElement, close: HTMLDivElement, control: Settings }
  protected thumbs: { img: HTMLImageElement, name: TSceneName }[] = []
  protected scene: { element: HTMLDivElement, inner: HTMLDivElement, btn: HTMLDivElement, spoil: Record<string, HTMLImageElement>, name: TSceneName }
  protected gamepadSupport: HTMLDivElement
  protected menuActive = false

  constructor() {
    this.loc = new Localization()
    this.container = document.createElement('div')
    this.container.className = styles.menu_layer
    this.container.setAttribute('style', 'display: none;')

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

    this.about = document.createElement('div')
    this.about.className = styles.about
    const aHeader = document.createElement('h3')
    // aHeader.innerText = 'About'
    this.loc.register('about', aHeader)
    const aboutInner = document.createElement('div')
    aboutInner.className = styles.about__inner
    const aboutClose = buttonClose()
    aboutClose.addEventListener('click', () => {
      this.about.setAttribute('style', 'display: none;')
    })
    aboutInner.append(aHeader, ...about(), aboutClose)
    this.about.append(aboutInner)

    const settingsContainer = document.createElement('div')
    settingsContainer.className = styles.settings
    const sHeader = document.createElement('h3')
    // sHeader.innerText = 'Settings'
    this.loc.register('settings', sHeader)
    const settingsInner = document.createElement('div')
    const settingsClose = buttonClose()
    settingsInner.className = styles.settings__inner
    const settings = new Settings()
    settingsInner.append(sHeader, settings.element, settingsClose)
    settingsContainer.append(settingsInner)
    this.settings = { element: settingsContainer, inner: settingsInner, close: settingsClose, control: settings }

    const scene = document.createElement('div')
    scene.className = styles.scene

    const sceneInner = document.createElement('div')
    sceneInner.className = styles.scene__inner
    const sceneClose = buttonClose()
    sceneClose.addEventListener('click', () => {
      this.scene.element.setAttribute('style', 'display: none;')
    })

    const btn = buttonCircle({ src: iconSrc.play })

    const spoil: Record<string, HTMLImageElement> = {}
    const spoilContainer = document.createElement('div')
    spoilContainer.className = styles.scene__spoil
    ANIMALS.forEach(key => {
      const n = key.replace(/\d/, '')
      if (!spoil[n]) {
        const icon = document.createElement('img')
        icon.src = spoilSrc[n]
        icon.alt = key
        icon.width = icon.height = 40
        spoilContainer.append(icon)
        spoil[n] = icon
      }
    })

    sceneInner.append(btn, spoilContainer, sceneClose)
    scene.append(sceneInner)
    this.scene = { element: scene, inner: sceneInner, btn, spoil, name: 'default' }

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

    this.container.append(version, this.gamepadSupport, level, this.menu, scene, this.about, this.settings.element)
  }

  protected menuInit(menuItems: MenuItem[]) {
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
    this.container.setAttribute('style', `display: ${state ? 'block' : 'none'};`)
    this.menuActive = state
  }

  public get element() {
    return this.container
  }
}

export class Menu extends MenuView {
  private startGame: (levelName: TSceneName, restart?: boolean) => void
  private confirm: ConfirmationModal
  private gamepadService?: GamepadService
  private twoPlayers: TwoPlayers
  private selectedMenuItemIndex = 0
  private activeMenuItemId: string | null = null

  constructor({ start, confirm, twoPlayers }: { start: (levelName: TSceneName, restart?: boolean) => void, confirm: ConfirmationModal, twoPlayers: TwoPlayers }) {
    super()
    this.startGame = start
    this.confirm = confirm
    this.twoPlayers = twoPlayers
    this.gamepadService = inject(GamepadService)

    this.menuInit([
      { id: 'start', icon: iconSrc.play, func: () => { this.activeMenuItemId = 'start'; this.handleStart() } },
      { id: 'twoPlayers', icon: iconSrc.gamepad, func: () => { this.activeMenuItemId = 'twoPlayers'; twoPlayers.show(true) } },
      { id: 'restart', icon: iconSrc.restart, func: () => { this.activeMenuItemId = 'restart'; this.handleRestart() } },
      { id: 'settings', icon: iconSrc.settings, func: () => { this.activeMenuItemId = 'settings'; this.handleSettings(true) } },
      // { id: 'about', icon: iconSrc.about, func: this.handleAbout },
    ])
    this.menuItems[0].element.classList.add(styles.hover)

    const btnAbout = buttonIcon({ src: iconSrc.about })
    btnAbout.classList.add(styles['top-right'])
    btnAbout.addEventListener('click', this.handleAbout)
    this.container.append(btnAbout)

    this.setupEventListeners();
  }

  private setupEventListeners = () => {
    this.thumbs.forEach(el => {
      el.img.addEventListener('click', this.handleSceneClick(el.name))
    })

    this.scene.btn.addEventListener('click', this.handleSceneStart)

    this.scene.element.addEventListener('click', this.handleOutsideClick)
    this.about.addEventListener('click', this.handleOutsideClick)
    this.settings.element.addEventListener('click', this.handleOutsideClick)
    this.settings.close.addEventListener('click', () => this.handleSettings(false))

    this.gamepadService?.registerCallbacks({ onButtonUp: this.handleGamepadButton, onGamepadConnected: this.handleGamepadConnected })

    for (const item of this.menuItems) {
      item.element.addEventListener('mouseenter', () => {
        this.selectedMenuItemIndex = item.index
        this.menuItems.forEach(({ element }, i) => { element.classList.toggle(styles.hover, i === item.index) })
      })
    }
  }

  private handleGamepadConnected = () => {
    this.gamepadSupport.classList.add(styles.active, styles.bounce)
  }

  private handleGamepadButton = (_gamepadIndex: number, buttonIndex: number) => {
    if (this.activeMenuItemId === 'settings' && buttonIndex === 0) {
      this.handleSettings(false)
    }

    if (!this.menuActive) return

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
            this.confirm.hide()
            this.startGame(SCENE_NAMES[0], true)
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
          this.twoPlayers.hide()
          break
        }
        case ('settings'): {
          this.handleSettings(false)
          break
        }
        case ('restart'): {
          this.confirm.hide()
          break
        }
        case ('confirmation'): {
          this.confirm.hide()
          break
        }
        default: {
          this.about.setAttribute('style', 'display: none;')
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
        child.classList.remove(styles.bounce)
      }
    }
  }

  private handleStart = () => {
    const name = SCENE_NAMES[Math.floor(Math.random() * SCENE_NAMES.length)]
    this.handleSceneClick(name)()
  }

  private handleRestart = () => {
    this.activeMenuItemId = 'confirmation'
    this.confirm.show({ text: this.loc.get('restartDesc'), acceptCallback: () => this.startGame(SCENE_NAMES[0], true) })
  }

  private handleAbout = () => {
    this.about.setAttribute('style', 'display: flex;')
    this.about.firstElementChild?.classList.add(styles.bounce)
  }

  private handleSettings = (show: boolean) => {
    if (show) {
      this.settings.element.setAttribute('style', 'display: flex;')
      this.settings.inner.classList.add(styles.bounce)
      this.settings.control.show(true)
      this.menuActive = false
    } else {
      this.settings.element.setAttribute('style', 'display: none;')
      this.settings.inner.classList.remove(styles.bounce)
      this.settings.control.show(false)
      this.menuActive = true
    }
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
    this.scene.inner.classList.add(styles.bounce)

    const spoil: TAnimalName[] = SCENE_TARGETS[name].filter((el): el is TAnimalName => ANIMALS.includes(el as TAnimalName))
    for (const key of ANIMALS) {
      const n = key.replace(/\d/, '')
      const el = this.scene.spoil[n]
      if (el) {
        const visible = spoil.includes(el.alt as TAnimalName)
        el.setAttribute('style', `display: ${visible ? 'block' : 'none'}`)
      }
    }
  }

  private handleSceneStart = () => {
    this.show(false)
    this.scene.element.setAttribute('style', 'display: none;')
    this.startGame(this.scene.name)
  }
}
