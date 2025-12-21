import { iconSrc } from "~/ui/icons"
import { Localization } from '~/service/localization'
import { GamepadService } from '~/service/gamepad'
import { inject } from '~/utils/inject'
import { formatTime } from "~/utils/time"
import { Caught } from '~/ui/caught/caught'
import { Storage } from "~/service/storage"
import { ScoreService } from "~/service/score"
import { ProphecyStars } from "~/ui/stars/stars"

import styles from './stageComplete.module.css'
import modal from '~/ui/modal.module.css'
import layer from '~/ui/layers.module.css'

class StageCompleteView {
  protected loc: Localization
  protected container: HTMLDivElement
  protected inner: HTMLDivElement
  protected button: HTMLDivElement
  protected stars: ProphecyStars
  protected result: {
    stars: HTMLDivElement,
    score: HTMLSpanElement,
    time: HTMLSpanElement,
    caught: HTMLSpanElement
  }
  protected isActive = false

  constructor() {
    this.loc = inject(Localization)

    this.container = document.createElement('div')
    this.container.classList.add(layer.win, styles.container)
    this.container.setAttribute('style', `display: none;`)

    const border = document.createElement('div')
    border.classList.add(modal.inner__border, modal.inner__mask)
    const bg = document.createElement('div')
    bg.classList.add(modal.inner__bg, modal.inner__mask, modal.inner__shadow)

    this.inner = document.createElement('div')
    this.inner.classList.add(modal.inner, modal.small)
    const h3 = document.createElement('h3')
    this.loc.register('stageComplete', h3)

    this.button = document.createElement('div')
    this.button.className = modal.button
    const menuLabel = document.createElement('span')
    this.loc.register('menu', menuLabel)
    const menuIcon = document.createElement('img')
    menuIcon.setAttribute('draggable', 'false')
    menuIcon.src = iconSrc.menu
    this.button.append(menuIcon, menuLabel)

    this.stars = new ProphecyStars()
    this.result = {
      stars: this.stars.element,
      score: document.createElement('span'),
      time: document.createElement('span'),
      caught: document.createElement('span'),
    }

    const score = document.createElement('div')
    const scoreLabel = document.createElement('span')
    this.loc.register('score', scoreLabel)
    score.append(scoreLabel, ': ', this.result.score)

    const time = document.createElement('div')
    const timeLabel = document.createElement('span')
    this.loc.register('time', timeLabel)
    time.append(timeLabel, ': ', this.result.time)

    const caught = document.createElement('div')
    const caughtLabel = document.createElement('span')
    this.loc.register('caught', caughtLabel)
    caught.append(caughtLabel, ': ', this.result.caught)

    const results = document.createElement('div')
    results.className = styles.results
    results.append(this.result.stars, score, time, caught)

    const content = document.createElement('div')
    content.className = modal.inner__content
    content.append(h3, results, this.button)

    this.inner.append(border, bg, content)
    this.container.append(this.inner)
  }

  public show = (state = true) => {
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

export class StageCompleteModal extends StageCompleteView {
  private storage: Storage
  private scoreService: ScoreService
  private menu: () => void
  private sceneUpdate: (_name: string, _count: number) => void
  private gamepadService: GamepadService
  private caught: Caught

  constructor({ menu, sceneUpdate }: { menu: () => void, sceneUpdate: (_name: string, _count: number) => void }) {
    super()
    this.menu = menu
    this.sceneUpdate = sceneUpdate

    this.storage = inject(Storage)
    this.scoreService = new ScoreService()
    this.caught = inject(Caught)
    this.gamepadService = inject(GamepadService)
    this.gamepadService.registerCallbacks({ onButtonUp: this.onGamepadButtonUp })

    this.button.addEventListener('click', this.handleMenu)
  }

  public handleComplete = (result: { scene: string, score: number, time: number, caught?: number, prophecy?: number }) => {
    this.result.score.innerText = result.score.toString()
    this.result.time.innerText = formatTime(result.time)
    this.result.caught.innerText = (result.caught || 0).toString()
    const sceneData = this.storage.get<{ stars: number, score: number } | undefined>(`data.scene.${result.scene}`)
    const gainStars = Math.floor(((result.prophecy || 0.3) + 0.1) * 3)
    if (gainStars > (sceneData?.stars || 0)) {
      this.sceneUpdate(result.scene, gainStars)
    }
    this.storage.set(`data.scene.${result.scene}`, {
      stars: Math.max(sceneData?.stars || 0, gainStars),
      score: Math.max(sceneData?.score || 0, result.score)
    })
    this.stars.showStars(gainStars)
    this.caught.handleUpdate('stars', gainStars)
    if (!sceneData?.score || result.score > sceneData?.score) {
      this.scoreService.update()
    }

    this.show(true)
  }

  private onGamepadButtonUp = (_gamepadIndex: number, buttonIndex: number) => {
    if (!this.isActive) return

    if (buttonIndex === 9) {  // Start button
      this.handleMenu()
    }
  }

  private handleMenu = () => {
    this.stars.stop()
    this.show(false)
    this.menu()
  }
}
