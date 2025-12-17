import { GamepadService } from "~/service/gamepad"
import { iconSrc } from '~/ui/icons'
import { Localization } from '~/service/localization'
import { Injectable, inject } from '~/utils/inject'
import { buttonClose } from '~/ui/button'
import { ACHIEVEMENTS } from "~/const"
import { AchievementsService } from "~/service/achievements"

import styles from './achievements.module.css'
import modal from '~/ui/modal.module.css'
import layer from '~/ui/layers.module.css'

class AchievementsView {
  protected loc: Localization
  protected container: HTMLDivElement
  protected inner: HTMLDivElement
  protected content: HTMLDivElement
  protected close: HTMLDivElement
  protected achievements: HTMLDivElement
  protected items: { key: string, element: HTMLDivElement, icon: HTMLImageElement, num?: HTMLDivElement, hidden?: true }[] = []
  protected isActive = false

  constructor() {
    this.loc = inject(Localization)

    this.container = document.createElement('div')
    this.container.classList.add(layer.achievements, modal.outer)
    this.container.setAttribute('style', 'display: none;')
    const border = document.createElement('div')
    border.classList.add(modal.inner__border, modal.inner__mask)
    const bg = document.createElement('div')
    bg.classList.add(modal.inner__bg, modal.inner__mask, modal.inner__shadow)

    this.content = document.createElement('div')
    this.content.className = modal.inner__content
    this.inner = document.createElement('div')
    this.inner.classList.add(modal.inner, modal.large)
    this.close = buttonClose()

    const h3 = document.createElement('h3')
    this.loc.register('achievements', h3)
    const icon = document.createElement('div')
    icon.className = modal.icon
    icon.setAttribute('style', `mask-image: url(${iconSrc.achievement});`)
    icon.setAttribute('style', `-webkit-mask-image: url(${iconSrc.achievement});`)
    const header = document.createElement('div')
    header.className = modal.header
    header.append(icon, h3)

    this.achievements = document.createElement('div')
    this.achievements.className = styles.achievements

    const dummy = document.createElement('div')
    dummy.className = modal.dummy

    this.content.append(header, this.achievements, dummy)
    this.inner.append(border, bg, this.content, this.close)

    this.container.append(this.inner)

    this.initAchievements()
  }

  private initAchievements = () => {
    for (const key of Object.keys(ACHIEVEMENTS)) {
      const item = ACHIEVEMENTS[key]

      const element = document.createElement('div')
      element.className = styles.item
      if (!item.hidden) element.title = this.loc.get(`ach.${key}`)

      const icon = document.createElement('img')
      icon.src = `./icons/achievements/${item.icon}.svg`
      icon.draggable = false
      if (item.hidden) icon.setAttribute('style', 'display: none;')
      element.append(icon)

      let num: HTMLDivElement | undefined
      if (item.num || item.hidden) {
        num = document.createElement('div')
        num.className = styles.numerator
        num.innerText = item.hidden ? '?' : (item.num || 0).toString()
        element.append(num)
      }
      this.achievements.append(element)
      this.items.push({ key, element, icon, num, hidden: item.hidden })
    }
  }

  public show(state = true) {
    if (state) {
      this.container.removeAttribute('style')
    } else {
      this.container.setAttribute('style', 'display: none')
    }
    this.inner.classList.toggle(modal.bounce, state)
    this.isActive = state
  }

  public get element() { return this.container }
}

@Injectable
export class AchievementsUI extends AchievementsView {
  private gamepadService: GamepadService
  private achievementsService: AchievementsService
  private callbacks: { onClose?: () => void } = {}

  constructor() {
    super()
    this.gamepadService = inject(GamepadService)
    this.achievementsService = inject(AchievementsService)

    this.registerEvents()
  }

  private update = () => {
    for (const item of this.items) {
      const collected = this.achievementsService.get(item.key)
      if (collected) {
        item.element.setAttribute('style', '--color: darkorange;')
        if (item.hidden && item.num) {
          item.icon.removeAttribute('style')
          item.num.setAttribute('style', 'display: none;')
          item.element.title = this.loc.get(`ach.${item.key}`)
        }
      }
    }
  }

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
  }

  private onGamepadButtonUp = (_gamepadIndex: number, buttonIndex: number) => {
    if (!this.isActive) return

    if (buttonIndex === 0) {
      this.show(false)
      if (this.callbacks.onClose) this.callbacks.onClose()
    }
  }

  public registerCallbacks = ({ onClose }: { onClose?: () => void }) => {
    if (onClose) this.callbacks.onClose = onClose
  }

  public show(state = true) {
    super.show(state)
    if (state) {
      this.update()
      this.achievementsService.clear()
    }
  }
}
