import { caughtDefault } from "~/const"
import { buttonClose } from "~/ui/button"
import { Localization } from '~/service/localization'
import { GamepadService } from "~/service/gamepad"
import { AudioService } from "~/service/audio"
import { SoundService } from "~/service/sound"
import { Injectable, inject } from "~/utils/inject"
import { iconSrc, spoilSrc } from "~/ui/icons"
import { Storage } from "~/service/storage"
import { Caught } from "~/ui/caught/caught"

import styles from './upgrade.module.css'
import modal from '~/ui/modal.module.css'
import layer from '~/ui/layers.module.css'

type TUpgradeCost = Record<string, number>
const upgrades: Record<string, { icon: string, grades: number, cost: TUpgradeCost }> = {
  jump: { icon: iconSrc.jump, grades: 5, cost: { butterfly: 10, frog: 10, star: 10 } },
  precise: { icon: iconSrc.eye, grades: 5, cost: { butterfly: 10, mouse: 10, star: 10 } },
  claws: { icon: iconSrc.claws, grades: 5, cost: { bird: 10, mouse: 10, star: 10 } },
  speed: { icon: iconSrc.speed, grades: 5, cost: { bird: 10, butterfly: 10, star: 10 } },
  // cat: { icon: iconSrc.cat, grades: 1, cost: { mouse: 50, frog: 50, star: 100 } }
}

class UpgradeView {
  protected loc: Localization
  protected container: HTMLDivElement
  protected inner: HTMLDivElement
  protected close: HTMLDivElement
  protected isActive = false
  protected upgrades: { name: string, element: HTMLLIElement, grade: HTMLDivElement[], materials: Record<string, HTMLSpanElement> }[] = []

  constructor() {
    this.loc = inject(Localization)
    this.container = document.createElement('div')
    this.container.classList.add(layer.upgrade, modal.outer)
    this.container.setAttribute('style', 'display: none;')

    const border = document.createElement('div')
    border.classList.add(modal.inner__border, modal.inner__mask)
    const bg = document.createElement('div')
    bg.classList.add(modal.inner__bg, modal.inner__mask, modal.inner__shadow)

    this.inner = document.createElement('div')
    this.inner.classList.add(modal.inner/* , modal.large */)

    const content = document.createElement('div')
    content.className = modal.inner__content

    const h3 = document.createElement('h3')
    this.loc.register('upgrade', h3)
    const icon = document.createElement('div')
    icon.className = modal.icon
    icon.setAttribute('style', `mask-image: url(${iconSrc.upgrade});`)
    const header = document.createElement('div')
    header.className = modal.header
    header.append(icon, h3)

    const dummy = document.createElement('div')
    dummy.className = modal.dummy

    content.append(header, this.createUpgrades(), dummy)

    this.close = buttonClose()

    this.inner.append(border, bg, content, this.close)
    this.container.append(this.inner)
  }

  private createUpgrades = () => {
    const container = document.createElement('ul')

    Object.keys(upgrades).forEach(name => {
      const { icon, grades, cost } = upgrades[name]

      const element = document.createElement('li')
      element.className = styles.list__element

      const paw = document.createElement('img')
      paw.src = iconSrc.paw
      paw.className = styles.paw

      const img = document.createElement('img')
      img.src = icon
      img.className = styles.icon

      const grade: HTMLDivElement[] = []
      const gradeContainer = document.createElement('div')
      gradeContainer.className = styles.grade
      for (let i = 0; i < grades; i += 1) {
        const square = document.createElement('div')
        square.className = styles.grade__square
        gradeContainer.append(square)
        grade.push(square)
      }

      const materials: Record<string, HTMLSpanElement> = {}
      const materialsContainer = document.createElement('div')
      materials.element = materialsContainer
      materialsContainer.className = styles.materials
      Object.keys(cost).forEach(key => {
        const spoil = document.createElement('img')
        spoil.src = key === 'star' ? iconSrc[key] : spoilSrc[key]
        const value = document.createElement('span')
        value.innerText = cost[key].toString()
        materialsContainer.append(spoil, value)
        materials[key] = value
      })

      const description = document.createElement('div')
      description.className = styles.description
      const descriptionText = document.createElement('span')
      this.loc.register(`${name}Desc`, descriptionText)
      description.append(descriptionText)

      this.upgrades.push({ name, element, grade, materials })
      element.append(paw, img, gradeContainer, materialsContainer, description)
      container.append(element)
    })

    return container
  }

  public get element() {
    return this.container
  }
}

@Injectable
export class UpgradeUI extends UpgradeView {
  private gamepadService: GamepadService
  private soundService: SoundService
  private storage: Storage
  private audioService: AudioService
  private caught: Caught
  private onClose?: () => void
  private selectedOptionIndex = 0
  private upgradesTotal = Object.keys(upgrades).length

  constructor() {
    super()
    this.gamepadService = inject(GamepadService)
    this.soundService = inject(SoundService)
    this.storage = inject(Storage)
    this.audioService = inject(AudioService)
    this.caught = inject(Caught)

    this.registerEvents()
    /*
    this.storage.set('data.caught', {
      butterfly: 500,
      frog: 500,
      mouse: 500,
      bird: 500,
    })
    this.storage.set('data.upgrades', {})
    */
  }

  private updateMaterials = () => {
    this.upgrades.forEach(item => {
      const grade = this.storage.get<number>(`data.upgrades.${item.name}`) || 0
      item.grade.forEach((el, i) => {
        if (grade >= i + 1) {
          el.classList.add(styles.active)
        }
      })

      if (grade >= upgrades[item.name].grades) {
        item.materials.element.setAttribute('style', 'display: none;')
      } else {
        Object.keys(item.materials).forEach(key => {
          if (key !== 'element') {
            const count = key === 'star' ? this.storage.get<number>('data.stars') || 0 : this.storage.get<number>(`data.caught.${key}`) || 0
            const value = this.getCost(upgrades[item.name].cost[key], grade)
            item.materials[key].innerText = value.toString()
            if (value <= count) {
              item.materials[key].removeAttribute('style')
            } else {
              item.materials[key].setAttribute('style', 'color: red;')
            }
          }
        })
      }
    })
  }

  private upgrade = (name: string) => {
    const grade = this.storage.get<number>(`data.upgrades.${name}`) || 0
    if (grade >= upgrades[name].grades) return

    const { cost } = upgrades[name]
    let available = true
    const caught = this.storage.get<Record<string, number>>('data.caught') || { ...caughtDefault }
    let stars = this.storage.get<number>('data.stars') || 0
    Object.keys(cost).forEach(key => {
      const count = key === 'star' ? stars : caught[key]
      const value = this.getCost(cost[key], grade)
      if (count < value) available = false
      if (key === 'star') { stars -= value } else { caught[key] -= value }
    })
    if (available) {
      this.storage.set(`data.upgrades.${name}`, grade + 1)
      this.storage.set(`data.caught`, caught)
      this.storage.set(`data.stars`, stars)
      this.caught.setCount({ ...caught, star: stars })
      this.updateMaterials()
      this.audioService.use('combo')
    } else {
      this.soundService.play('error')
    }
  }

  private getCost = (value: number, grade: number) => Math.ceil(Math.pow(value, (1 + grade * 0.3)))

  private registerEvents = () => {
    this.gamepadService.registerCallbacks({
      onButtonUp: this.onGamepadButtonUp
    })

    this.container.addEventListener('click', event => {
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

    this.upgrades.forEach((item, index) => {
      item.element.addEventListener('mouseenter', () => {
        if (this.selectedOptionIndex !== index) {
          this.selectedOptionIndex = index
          this.handleOptionSelect()
        }
      })
      item.element.addEventListener('click', () => this.upgrade(item.name))
    })
    this.handleOptionSelect(true)
  }

  private handleOptionSelect = (silent = false) => {
    this.upgrades.forEach((item, i) => {
      item.element.classList.toggle(styles.hover, i === this.selectedOptionIndex)
    })
    if (!silent) this.soundService.play('tap')
  }

  public registerCallback = ({ onClose }: { onClose: () => void }) => {
    this.onClose = onClose
  }

  private onGamepadButtonUp = (_gamepadIndex: number, buttonIndex: number) => {
    if (!this.isActive) return

    if (buttonIndex === 12 || buttonIndex === 13) {
      if (buttonIndex === 12) { // up
        this.selectedOptionIndex = this.selectedOptionIndex > 0 ? this.selectedOptionIndex - 1 : 0
      }
      if (buttonIndex === 13) { // down
        this.selectedOptionIndex = this.selectedOptionIndex < this.upgradesTotal - 1 ? this.selectedOptionIndex + 1 : this.upgradesTotal - 1
      }
      this.handleOptionSelect()
    }

    if (buttonIndex === 1) {
      this.upgrade(this.upgrades[this.selectedOptionIndex].name)
    }

    if (buttonIndex === 0) {
      this.show(false)
      if (this.onClose) this.onClose()
    }
  }

  public show = (state = true) => {
    if (state) {
      this.container.removeAttribute('style')
      this.updateMaterials()
    } else {
      this.container.setAttribute('style', 'display: none')
    }
    this.inner.classList.toggle(modal.bounce, state)
    this.isActive = state
  }

  public hide = () => {
    this.show(false)
  }
}
