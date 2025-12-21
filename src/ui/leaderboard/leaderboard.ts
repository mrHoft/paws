import { LeaderboardService, type LeaderboardEntry } from "~/service/leaderboard"
import { GamepadService } from "~/service/gamepad"
import { iconSrc } from '~/ui/icons'
import { Localization } from '~/service/localization'
import { Injectable, inject } from '~/utils/inject'
import { buttonClose } from '~/ui/button'

import styles from './leaderboard.module.css'
import modal from '~/ui/modal.module.css'
import layer from '~/ui/layers.module.css'

class LeaderboardView {
  protected loc: Localization
  protected container: HTMLDivElement
  protected inner: HTMLDivElement
  protected content: HTMLDivElement
  protected close: HTMLDivElement
  protected leaderboard: HTMLDivElement
  protected isActive = false

  constructor() {
    this.loc = inject(Localization)

    this.container = document.createElement('div')
    this.container.classList.add(layer.leaderboard, modal.outer)
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
    this.loc.register('leaderboard', h3)
    const icon = document.createElement('div')
    icon.className = modal.icon
    icon.setAttribute('style', `mask-image: url(${iconSrc.crown});`)
    icon.setAttribute('style', `-webkit-mask-image: url(${iconSrc.crown});`)
    const header = document.createElement('div')
    header.className = modal.header
    header.append(icon, h3)

    this.leaderboard = document.createElement('div')
    // this.leaderboard.className = styles.leaderboard

    const dummy = document.createElement('div')
    dummy.className = modal.dummy

    this.content.append(header, this.leaderboard, dummy)
    this.inner.append(border, bg, this.content, this.close)

    this.container.append(this.inner)
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
export class LeaderboardUI extends LeaderboardView {
  private gamepadService: GamepadService
  private leaderboardService: LeaderboardService
  private callbacks: { onClose?: () => void, onUpgrade?: () => void } = {}

  constructor() {
    super()
    this.gamepadService = inject(GamepadService)
    this.leaderboardService = inject(LeaderboardService)

    this.registerEvents()
  }

  private renderLeaderboard = () => {
    this.leaderboard.innerHTML = this.loc.get('loading')
    this.leaderboardService.get().then(leaderboard => {
      this.leaderboard.innerHTML = ''
      for (const item of leaderboard) {
        this.leaderboard.append(this.createEntry(item))
      }
    })
  }

  private createEntry = (data: LeaderboardEntry) => {
    const entry = document.createElement('div')
    entry.className = styles.leaderboard_entry
    const rank = document.createElement('span')
    rank.innerText = `${data.rank}.`
    const img = document.createElement('img')
    img.src = data.avatar
    img.className = styles.avatar
    const name = document.createElement('span')
    name.append(img, (data.name || 'Unknown').slice(0, 20))
    const score = document.createElement('span')
    score.innerText = data.score.toString()
    entry.append(rank, name, score)

    return entry
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
      this.renderLeaderboard()
    }
  }
}
