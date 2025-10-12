import { GAME, LEVEL_NAMES, TARGETS_PER_LEVEL, ANIMAL_LIST, type TLevelName, type TAnimalName } from "~/const"
import { /* Caught, */ spoilSrc } from "~/ui/overlay/caught"
import { circleButton } from "~/ui/circleButton/button"
import { about } from "~/ui/about/about"

import styles from './menu.module.css'

const icons = {
  play: './icons/play.svg',
  settings: './icons/settings.svg',
  about: './icons/about.svg'
}

const PATH = './thumb'

interface MenuItem { id: string, icon: string, title: string, func: () => void }

class MenuView {
  protected container: HTMLDivElement
  protected menu: HTMLDivElement
  protected about: HTMLDivElement
  protected thumbs: { img: HTMLImageElement, name: TLevelName }[] = []
  protected scene: { element: HTMLDivElement, inner: HTMLDivElement, btn: HTMLDivElement, spoil: Partial<Record<TAnimalName, HTMLImageElement>>, name: TLevelName }

  constructor() {
    this.container = document.createElement('div')
    this.container.className = styles.menu_layer
    this.container.setAttribute('style', 'display: none;')

    const level = document.createElement('div')
    level.className = styles.level
    const h = Math.floor(100 / (LEVEL_NAMES.length - 1) * 2)
    level.setAttribute('style', `height: ${100 - h * .75}%;`)

    const shift = Math.PI / 2 / (LEVEL_NAMES.length - 1)
    for (let i = LEVEL_NAMES.length - 1; i >= 0; i -= 1) {
      const name = LEVEL_NAMES[i]
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
    const aboutInner = document.createElement('div')
    aboutInner.className = styles.about__inner
    aboutInner.append(...about())
    this.about.append(aboutInner)

    const scene = document.createElement('div')
    scene.className = styles.scene

    const sceneInner = document.createElement('div')
    sceneInner.className = styles.scene__inner

    const btn = circleButton(icons.play)

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

    sceneInner.append(btn, spoilContainer)
    scene.append(sceneInner)
    this.scene = { element: scene, inner: sceneInner, btn, spoil, name: 'default' }

    const version = document.createElement('div')
    version.className = styles.version
    version.innerText = GAME.version

    this.menu = document.createElement('div')
    this.menu.className = styles.menu

    this.container.append(level, this.menu, scene, this.about, version)
  }

  protected menuInit(menuItems: MenuItem[]) {
    for (const item of menuItems) {
      const button = document.createElement('button')
      const icon = document.createElement('img')
      icon.src = item.icon
      icon.alt = item.id
      button.append(icon, item.title)
      button.onclick = item.func
      this.menu.append(button)
    }
  }

  public show = (state = true) => {
    this.container.setAttribute('style', `display: ${state ? 'block' : 'none'};`)
  }

  public get element() {
    return this.container
  }
}

export class Menu extends MenuView {
  // private caught: Caught

  constructor({ start }: { start: (levelName: TLevelName) => void }) {
    super()
    /*
    this.caught = new Caught
    const header = document.createElement('div')
    header.className = styles.header
    header.append(this.caught.element)
    this.container.append(header)
    */
    this.thumbs.forEach(el => {
      el.img.addEventListener('click', this.handleSceneClick(el.name))
    })

    this.scene.btn.addEventListener('click', () => {
      this.scene.element.setAttribute('style', 'display: none;')
      start(this.scene.name)
    })

    this.scene.element.addEventListener('click', this.handleOutsideClick)
    this.about.addEventListener('click', this.handleOutsideClick)

    const menuItems: MenuItem[] = [
      { id: 'start', icon: icons.play, title: 'Start', func: this.handleStart },
      // { id: 'settings', icon: icons.settings, title: 'Settings', func: () => console.log('settings') },
      { id: 'about', icon: icons.about, title: 'About', func: this.handleAbout },
    ]
    this.menuInit(menuItems)
  }

  private handleOutsideClick = (event: PointerEvent) => {
    const { target, currentTarget } = event;
    if (currentTarget && target === currentTarget) {
      event.preventDefault();
      (currentTarget as HTMLDivElement).setAttribute('style', 'display: none;')
    }
  }

  private handleStart = () => {
    const name = LEVEL_NAMES[Math.floor(Math.random() * LEVEL_NAMES.length)]
    this.handleSceneClick(name)()
  }

  private handleAbout = () => {
    this.about.setAttribute('style', 'display: flex;')
  }

  private handleSceneClick = (name: TLevelName) => (event?: PointerEvent) => {
    if (event) {
      const element = event.currentTarget as HTMLElement;
      element.style.pointerEvents = 'none'
      void element.offsetHeight
      setTimeout(() => { element.style.pointerEvents = '' }, 0);
    }

    this.scene.name = name
    this.scene.element.setAttribute('style', 'display: flex;')
    this.scene.inner.setAttribute('style', `background-image: url(${PATH}/${name}.jpg)`)

    const spoil: TAnimalName[] = TARGETS_PER_LEVEL[name].filter((el): el is TAnimalName => ANIMAL_LIST.includes(el as TAnimalName))
    for (const key of ANIMAL_LIST) {
      const el = this.scene.spoil[key]
      if (el) {
        const visible = spoil.includes(el.alt as TAnimalName)
        el.setAttribute('style', `display: ${visible ? 'block' : 'none'}`)
      }
    }
  }
}
