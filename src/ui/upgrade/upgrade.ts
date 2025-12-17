import { caughtDefault, UPGRADES } from "~/const"
import { buttonClose } from "~/ui/button"
import { Localization } from '~/service/localization'
import { GamepadService } from "~/service/gamepad"
import { AchievementsService } from "~/service/achievements"
import { AudioService } from "~/service/audio"
import { SoundService } from "~/service/sound"
import { Injectable, inject } from "~/utils/inject"
import { iconSrc, spoilSrc } from "~/ui/icons"
import { Storage } from "~/service/storage"
import { Caught } from "~/ui/caught/caught"
import { ConfirmationModal } from "../confirmation/confirm"
import type { TUpgrades } from "~/engine/types"

import styles from './upgrade.module.css'
import modal from '~/ui/modal.module.css'
import layer from '~/ui/layers.module.css'

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
    this.inner.classList.add(modal.inner, modal.large)

    const content = document.createElement('div')
    content.className = modal.inner__content

    const h3 = document.createElement('h3')
    this.loc.register('upgrades', h3)
    const icon = document.createElement('div')
    icon.className = modal.icon
    icon.setAttribute('style', `mask-image: url(${iconSrc.upgrade});`)
    icon.setAttribute('style', `-webkit-mask-image: url(${iconSrc.upgrade});`)
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
    container.className = styles.list

    Object.keys(UPGRADES).forEach(name => {
      const { icon, grades, cost } = UPGRADES[name]

      const element = document.createElement('li')
      element.className = styles.list__element

      const paw = document.createElement('img')
      paw.setAttribute('draggable', 'false')
      paw.src = iconSrc.paw
      paw.className = styles.paw

      const img = document.createElement('img')
      img.setAttribute('draggable', 'false')
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
        spoil.setAttribute('draggable', 'false')
        spoil.src = spoilSrc[key]
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

    // Reset
    const element = document.createElement('li')
    element.className = styles.list__element

    const paw = document.createElement('img')
    paw.setAttribute('draggable', 'false')
    paw.src = iconSrc.paw
    paw.className = styles.paw

    const icon = document.createElement('div')
    icon.className = modal.icon
    icon.setAttribute('style', `mask-image: url(${iconSrc.reset});`)
    icon.setAttribute('style', `-webkit-mask-image: url(${iconSrc.reset});`)

    const label = document.createElement('div')
    this.loc.register('reset', label)

    element.append(paw, icon, label)
    container.append(element)
    this.upgrades.push({ name: 'reset', element, grade: [], materials: {} })

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
  private achievementsService: AchievementsService
  private storage: Storage
  private audioService: AudioService
  private caught: Caught
  private confirmationModal: ConfirmationModal
  private callbacks: { onClose?: () => void, onUpdate?: () => void } = {}
  private selectedOptionIndex = 0
  private upgradesTotal = Object.keys(UPGRADES).length

  constructor() {
    super()
    this.gamepadService = inject(GamepadService)
    this.soundService = inject(SoundService)
    this.achievementsService = inject(AchievementsService)
    this.storage = inject(Storage)
    this.audioService = inject(AudioService)
    this.caught = inject(Caught)
    this.confirmationModal = inject(ConfirmationModal)
    this.confirmationModal.registerCallback({ onClose: () => { this.isActive = true } })

    this.registerEvents()

    // this.storage.set('data.caught', {insect: 1500,frog: 1500,mouse: 1500,bird: 1500,stars: 1500})
  }

  public getAvailable = () => {
    let availableUpgrades = 0
    this.upgrades.forEach(item => {
      if (item.name !== 'reset') {
        let sufficientMaterials = 0
        const grade = this.storage.get<number>(`data.upg.${item.name}`) || 0
        const upgrade = UPGRADES[item.name]
        if (grade < upgrade.grades) {
          item.materials.element.removeAttribute('style')
          Object.keys(item.materials).forEach(key => {
            if (key !== 'element') {
              const count = this.storage.get<number>(`data.caught.${key}`) || 0
              const value = this.getCost(upgrade.cost[key], grade)
              if (value <= count) sufficientMaterials += 1
            }
          })
        }
        if (sufficientMaterials >= 3) availableUpgrades += 1
      }
    })

    return availableUpgrades
  }

  private updateMaterials = () => {
    this.upgrades.forEach(item => {
      if (item.name !== 'reset') {
        const grade = this.storage.get<number>(`data.upg.${item.name}`) || 0
        item.grade.forEach((el, i) => {
          el.classList.toggle(styles.active, grade >= i + 1)
        })

        if (grade >= UPGRADES[item.name].grades) {
          item.materials.element.setAttribute('style', 'opacity: 0;')
        } else {
          item.materials.element.removeAttribute('style')
          Object.keys(item.materials).forEach(key => {
            if (key !== 'element') {
              const count = this.storage.get<number>(`data.caught.${key}`) || 0
              const value = this.getCost(UPGRADES[item.name].cost[key], grade)
              item.materials[key].innerText = value.toString()
              if (value <= count) {
                item.materials[key].removeAttribute('style')
              } else {
                item.materials[key].setAttribute('style', 'color: red;')
              }
            }
          })
        }
      }
    })
  }

  private handleReset = () => {
    const savedUpgrades = this.storage.get<TUpgrades>('data.upg') || {}
    if (Object.values(savedUpgrades).reduce((acc, val) => acc + val, 0) === 0) return

    const caught = { ...this.storage.get<Record<string, number>>('data.caught') }

    for (const key of Object.keys(savedUpgrades)) {
      const grade = savedUpgrades[key as keyof TUpgrades]
      const upgrade = UPGRADES[key]
      if (upgrade) {
        for (const resource of Object.keys(upgrade.cost)) {
          const value = upgrade.cost[resource]
          for (let i = 1; i <= grade; i += 1) {
            const cost = this.getCost(value, i - 1)
            if (!caught[resource]) caught[resource] = 0
            caught[resource] += Math.floor(cost / 2)
          }
        }
      }
    }

    this.caught.setCount(caught)
    this.storage.set('data.upg', {})
    this.storage.set('data.caught', caught)
    this.updateMaterials()
    if (this.callbacks.onUpdate) this.callbacks.onUpdate()
  }

  private handleUpgrade = (name: string) => {
    if (name == 'reset') {
      this.isActive = false
      this.confirmationModal.show({ text: this.loc.get('resetDesc'), acceptCallback: this.handleReset })
      return
    }

    const grade = this.storage.get<number>(`data.upg.${name}`) || 0
    if (grade >= UPGRADES[name].grades) return

    const { cost } = UPGRADES[name]
    let available = true
    const caught = { ...this.storage.get<Record<string, number>>('data.caught') || caughtDefault }
    Object.keys(cost).forEach(key => {
      const value = this.getCost(cost[key], grade)
      if (caught[key] < value) { available = false } else { caught[key] -= value }
    })
    if (available) {
      this.storage.set(`data.upg.${name}`, grade + 1)
      this.storage.set('data.caught', caught)
      this.caught.setCount(caught)
      this.updateMaterials()
      this.audioService.use('combo')
      if (this.callbacks.onUpdate) this.callbacks.onUpdate()
      this.achievementsService.check('upgrade')
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
      event.preventDefault()
      const { target, currentTarget } = event;
      if (target === currentTarget) {
        this.show(false)
        if (this.callbacks.onClose) this.callbacks.onClose()
      }
    })

    this.close.addEventListener('click', () => {
      this.show(false)
      if (this.callbacks.onClose) this.callbacks.onClose()
    })

    this.upgrades.forEach((item, index) => {
      item.element.addEventListener('mouseenter', () => {
        if (this.selectedOptionIndex !== index) {
          this.selectedOptionIndex = index
          this.handleOptionSelect()
        }
      })
      item.element.addEventListener('click', () => this.handleUpgrade(item.name))
    })
    this.handleOptionSelect(true)
  }

  private handleOptionSelect = (silent = false) => {
    this.upgrades.forEach((item, i) => {
      item.element.classList.toggle(styles.hover, i === this.selectedOptionIndex)
    })
    if (!silent) this.soundService.play('tap')
  }

  public registerCallbacks = ({ onClose, onUpdate }: { onClose?: () => void, onUpdate?: () => void }) => {
    if (onClose) this.callbacks.onClose = onClose
    if (onUpdate) this.callbacks.onUpdate = onUpdate
  }

  private onGamepadButtonUp = (_gamepadIndex: number, buttonIndex: number) => {
    if (!this.isActive) return

    if (buttonIndex === 12 || buttonIndex === 13) {
      if (buttonIndex === 12) { // up
        this.selectedOptionIndex = this.selectedOptionIndex > 0 ? this.selectedOptionIndex - 1 : 0
      }
      if (buttonIndex === 13) { // down
        this.selectedOptionIndex = this.selectedOptionIndex < this.upgradesTotal ? this.selectedOptionIndex + 1 : this.upgradesTotal
      }
      this.handleOptionSelect()
    }

    if (buttonIndex === 1) {
      this.handleUpgrade(this.upgrades[this.selectedOptionIndex].name)
    }

    if (buttonIndex === 0) {
      this.show(false)
      if (this.callbacks.onClose) this.callbacks.onClose()
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
