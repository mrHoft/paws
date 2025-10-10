import { CANVAS, LEVEL_NAMES, type TLevelName } from "~/const"
// import { Caught } from "~/ui/overlay/caught"
import { circleButton } from "~/ui/circleButton/button"

import styles from './menu.module.css'

const PATH = '/thumb'
const imgHeight = 100
const imgWidth = imgHeight * (4 / 3)
const padding = 20

class MenuView {
  protected container: HTMLDivElement
  protected thumbs: { img: HTMLImageElement, name: TLevelName }[] = []
  protected scene: { element: HTMLDivElement, inner: HTMLDivElement, btn: HTMLDivElement, name: TLevelName }

  constructor() {
    this.container = document.createElement('div')
    this.container.className = styles.menu_layer
    this.container.setAttribute('style', 'display: none;')

    const shift = Math.PI / 2 / (LEVEL_NAMES.length - 1)
    const w = CANVAS.width - imgWidth
    const h = CANVAS.height - imgHeight - padding * 2
    for (let i = LEVEL_NAMES.length - 1; i >= 0; i -= 1) {
      const name = LEVEL_NAMES[i]
      const img = document.createElement('img')
      img.className = styles.thumb
      img.src = `${PATH}/${name}.jpg`
      img.width = imgWidth
      img.height = imgHeight


      const r = Math.PI * 1 - i * shift
      const x = padding + w / 2 + Math.floor(Math.cos(r) * w / 2)
      const y = padding + Math.floor(Math.sin(r) * h)
      img.setAttribute('style', `top: ${y}px; left: ${x}px;`)
      this.thumbs.push({ img, name })
      this.container.append(img)
    }

    const scene = document.createElement('div')
    scene.className = styles.scene
    const inner = document.createElement('div')
    const btn = circleButton('/icons/play.svg')
    inner.append(btn)
    scene.append(inner)
    this.scene = { element: scene, inner, btn, name: 'default' }
    this.container.append(scene)
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
      console.log(this.scene.name)
      this.scene.element.setAttribute('style', 'display: none;')
      start(this.scene.name)
    })

    this.scene.element.addEventListener('click', event => {
      const { target, currentTarget } = event;
      if (target === currentTarget) {
        event.preventDefault();
        this.scene.element.setAttribute('style', 'display: none;')
      }
    })
  }

  private handleSceneClick = (name: TLevelName) => (event: PointerEvent) => {
    const element = event.currentTarget as HTMLElement;
    element.style.pointerEvents = 'none'
    void element.offsetHeight
    setTimeout(() => { element.style.pointerEvents = '' }, 0);

    this.scene.name = name
    this.scene.element.setAttribute('style', 'display: flex;')
    this.scene.inner.setAttribute('style', `width: ${400}px; height: ${300}px; background-image: url(${PATH}/${name}.jpg)`)
  }
}
