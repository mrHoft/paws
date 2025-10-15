import { GAME, SCENE_NAMES, SCENE_TARGETS, ANIMAL_LIST, type TSceneName, type TAnimalName } from "~/const"
import { buttonCircle, buttonIcon } from "~/ui/button"
import { about } from "~/ui/about/about"
import { Settings } from "~/ui/settings/settings"
import { iconSrc, spoilSrc } from "~/ui/icons"
import { Localization } from '~/service/localization'

import styles from './menu.module.css'

const PATH = './thumb'

interface MenuItem { id: string, icon: string, func: () => void }

class MenuView {
  private loc: Localization
  protected container: HTMLDivElement
  protected menu: HTMLDivElement
  protected about: HTMLDivElement
  protected settings: HTMLDivElement
  protected thumbs: { img: HTMLImageElement, name: TSceneName }[] = []
  protected scene: { element: HTMLDivElement, inner: HTMLDivElement, btn: HTMLDivElement, spoil: Partial<Record<TAnimalName, HTMLImageElement>>, name: TSceneName }

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
    const aboutClose = this.createCloseBtn()
    aboutClose.addEventListener('click', () => {
      this.about.setAttribute('style', 'display: none;')
    })
    aboutInner.append(aHeader, ...about(), aboutClose)
    this.about.append(aboutInner)

    this.settings = document.createElement('div')
    this.settings.className = styles.settings
    const sHeader = document.createElement('h3')
    // sHeader.innerText = 'Settings'
    this.loc.register('settings', sHeader)
    const settingsInner = document.createElement('div')
    const settingsClose = this.createCloseBtn()
    settingsClose.addEventListener('click', () => {
      this.settings.setAttribute('style', 'display: none;')
    })
    settingsInner.className = styles.settings__inner
    settingsInner.append(sHeader, new Settings().element, settingsClose)
    this.settings.append(settingsInner)

    const scene = document.createElement('div')
    scene.className = styles.scene

    const sceneInner = document.createElement('div')
    sceneInner.className = styles.scene__inner
    const sceneClose = this.createCloseBtn()
    sceneClose.addEventListener('click', () => {
      this.scene.element.setAttribute('style', 'display: none;')
    })

    const btn = buttonCircle(iconSrc.play)

    const spoil: Partial<Record<TAnimalName, HTMLImageElement>> = {}
    const spoilContainer = document.createElement('div')
    spoilContainer.className = styles.scene__spoil
    ANIMAL_LIST.forEach(key => {
      const icon = document.createElement('img')
      icon.src = spoilSrc[key]
      icon.alt = key
      icon.width = icon.height = 40
      spoilContainer.append(icon)
      spoil[key] = icon
    })

    sceneInner.append(btn, spoilContainer, sceneClose)
    scene.append(sceneInner)
    this.scene = { element: scene, inner: sceneInner, btn, spoil, name: 'default' }

    const version = document.createElement('div')
    version.className = styles.version
    version.innerText = GAME.version

    this.menu = document.createElement('div')
    this.menu.className = styles.menu

    this.container.append(version, level, this.menu, scene, this.about, this.settings)
  }

  protected menuInit(menuItems: MenuItem[]) {
    for (const item of menuItems) {
      const button = document.createElement('button')
      const icon = document.createElement('img')
      icon.src = item.icon
      icon.alt = item.id
      const text = document.createElement('span')
      this.loc.register(item.id, text)
      button.append(icon, text)
      button.onclick = item.func
      this.menu.append(button)
    }
  }

  private createCloseBtn = () => {
    const btn = document.createElement('div')
    btn.className = styles.close
    const img = document.createElement('img')
    img.src = iconSrc.close
    btn.append(img)

    return btn
  }

  public show = (state = true) => {
    this.container.setAttribute('style', `display: ${state ? 'block' : 'none'};`)
  }

  public get element() {
    return this.container
  }
}

export class Menu extends MenuView {
  private startGame: (levelName: TSceneName, restart?: boolean) => void

  constructor({ start }: { start: (levelName: TSceneName, restart?: boolean) => void }) {
    super()
    this.startGame = start
    this.thumbs.forEach(el => {
      el.img.addEventListener('click', this.handleSceneClick(el.name))
    })

    this.scene.btn.addEventListener('click', () => {
      this.scene.element.setAttribute('style', 'display: none;')
      this.startGame(this.scene.name)
    })

    this.scene.element.addEventListener('click', this.handleOutsideClick)
    this.about.addEventListener('click', this.handleOutsideClick)
    this.settings.addEventListener('click', this.handleOutsideClick)

    const menuItems: MenuItem[] = [
      { id: 'start', icon: iconSrc.play, func: this.handleStart },
      { id: 'restart', icon: iconSrc.restart, func: this.handleRestart },
      { id: 'settings', icon: iconSrc.settings, func: this.handleSettings },
      // { id: 'about', icon: iconSrc.about, func: this.handleAbout },
    ]
    this.menuInit(menuItems)

    const btnAbout = buttonIcon({ src: iconSrc.about })
    btnAbout.classList.add(styles['top-right'])
    btnAbout.addEventListener('click', this.handleAbout)
    this.container.append(btnAbout)
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
    this.startGame(SCENE_NAMES[0], true)
  }

  private handleAbout = () => {
    this.about.setAttribute('style', 'display: flex;')
    this.about.firstElementChild?.classList.add(styles.bounce)
  }

  private handleSettings = () => {
    this.settings.setAttribute('style', 'display: flex;')
    this.settings.firstElementChild?.classList.add(styles.bounce)
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

    const spoil: TAnimalName[] = SCENE_TARGETS[name].filter((el): el is TAnimalName => ANIMAL_LIST.includes(el as TAnimalName))
    for (const key of ANIMAL_LIST) {
      const el = this.scene.spoil[key]
      if (el) {
        const visible = spoil.includes(el.alt as TAnimalName)
        el.setAttribute('style', `display: ${visible ? 'block' : 'none'}`)
      }
    }
  }
}
