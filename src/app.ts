import { Resource } from '~/engine/resource'
import { CANVAS, type TSceneName } from '~/const'
import { Weather } from '~/ui/weather/weather'
import { PauseModal } from '~/ui/pause/pause'
import { ConfirmationModal } from './ui/confirmation/confirm'
import { Overlay } from '~/ui/overlay/overlay'
import { GlobalUI } from '~/ui/global/global'
import { Settings } from '~/ui/settings/settings'
import { Menu } from '~/ui/menu/menu'
import { About } from './ui/about/about'
import { Storage } from '~/service/storage'
import { Audio } from '~/service/audio'
import { ShepardTone, type ShepardToneConfig } from './service/shepardTone'
import { Localization } from '~/service/localization'
import { FocusListener } from '~/service/focus'
import { TwoPlayers } from '~/ui/twoPlayers/twoPlayers'
import { injector, inject } from '~/utils/inject'
import type { EngineOptions } from './engine/types'

const autoStartScene: TSceneName | null = 'autumn'

type TErrorSource = 'assets' | 'api'

export class AppView {
  protected root: HTMLDivElement
  protected game: HTMLElement
  protected loader?: HTMLDivElement
  protected loaderBar?: HTMLDivElement
  protected loaderValue?: HTMLDivElement
  protected message?: HTMLDivElement
  protected errors: { source: TErrorSource, message: string, lapse: number }[] = []

  constructor() {
    const root = document.querySelector<HTMLDivElement>('#app')
    if (root) {
      this.root = root
      const main = document.createElement('main')
      main.className = 'main'
      main.setAttribute('style', `max-width: ${CANVAS.width}px; max-height: ${CANVAS.height}px;`)

      this.game = document.createElement('div')
      this.game.className = 'game'
      this.game.setAttribute('style', `aspect-ratio: ${CANVAS.aspectRatio};`)
      main.append(this.game)

      this.root.append(main)
    } else {
      throw new Error('Root element not found')
    }
  }

  protected loaderInit() {
    this.loader = document.createElement('div')
    this.loader.classList.add('loader_layer')
    const container = document.createElement('div')
    container.classList.add('loader')
    this.loaderBar = document.createElement('div')
    this.loaderBar.classList.add('loader__bar')
    this.loaderValue = document.createElement('div')
    this.loaderValue.classList.add('loader__value')
    container.append(this.loaderBar, this.loaderValue)
    this.loader.append(container)

    this.message = document.createElement('div')
    this.message.classList.add('loader__message')

    this.game.append(this.loader, this.message)
  }

  protected loaderRemove() {
    if (this.loader) this.loader.remove()
    if (this.message) {
      if (!this.errors.length) {
        this.message.remove()
      }
    }
  }

  protected loaderUpdate(progress: number) {
    if (this.loaderValue && this.loaderBar) {
      this.loaderValue.innerText = `${progress}%`
      this.loaderBar.setAttribute('style', `width: ${progress}%;`)
    }
  }
}

export class App extends AppView {
  private loading = { start: 0 }
  private pause?: PauseModal
  private confirm?: ConfirmationModal
  private overlay?: Overlay
  private weather?: Weather
  private audio: Audio
  private menu?: Menu
  private ui?: GlobalUI
  private storage: Storage
  private focus: FocusListener
  private engineStart?: (options1?: EngineOptions, options2?: EngineOptions) => void

  constructor() {
    super()
    this.storage = inject(Storage)
    injector.createInstance(Localization, this.storage.get('language'))

    const musicVolume = Math.max(0, Math.min(this.storage.get<number>('music'), 1))
    const music = {
      volume: musicVolume,
      muted: musicVolume === 0
    }
    const soundVolume = Math.max(0, Math.min(this.storage.get<number>('sound'), 1))
    const sound = {
      volume: soundVolume,
      muted: soundVolume === 0
    }
    this.audio = injector.createInstance(Audio, { music, sound })

    const config: ShepardToneConfig = {
      baseFrequency: 220,
      numOscillators: 2,
      cycleDuration: 6.0,
      oscillatorType: 'sine',
      volume: soundVolume,
      direction: 'ascending'
    }
    injector.createInstance(ShepardTone, config)

    this.focus = new FocusListener()
    this.focus.addCallbacks({
      focusLoss: () => { this.audio.mute = true },
      focusGain: () => { this.audio.mute = false }
    })
  }

  public init = async (): Promise<void> => {
    this.loaderInit()
    this.root.addEventListener('contextmenu', (event) => {
      event.preventDefault()
      return false
    })

    this.loading.start = Date.now()

    const progressCallback = (progress: number) => {
      this.loaderUpdate(progress)
      if (progress === 100) {
        console.log(`\x1b[33m${resource.total}\x1b[0m assets loaded in \x1b[33m${Date.now() - this.loading.start}ms\x1b[0m`)
        this.handleLoadComplete()
      }
    }

    const resource = injector.createInstance(Resource)
    resource.registerCallbacks({ progressCallback, errorCallback: () => this.onError({ source: 'assets' }) })
  }

  private handleLoadComplete = () => {
    this.loaderRemove()
    const twoPlayersUI = injector.createInstance(TwoPlayers, { start: this.startSinglePlayerGame })
    this.confirm = new ConfirmationModal()
    this.menu = new Menu({ start: this.startSinglePlayerGame, confirm: this.confirm })
    this.ui = new GlobalUI()
    const settings = inject(Settings)
    const about = inject(About)

    this.game.append(this.menu.element, this.ui.element, this.confirm.element, twoPlayersUI.element, settings.element, about.element)

    if (autoStartScene) {
      this.initGame().then(() => {
        this.engineStart!({ sceneName: autoStartScene, multiplayer: 'top' }, { sceneName: autoStartScene, multiplayer: 'bottom', control: 'keyboard' })
      })
      return
    }

    if (this.errors.length) {
      return
    }

    this.menu.show()
  }

  private initGame = async () => {
    const canvas: HTMLCanvasElement[] = Array.from({ length: 2 }, (_, i) => {
      const el = document.createElement('canvas')
      el.width = CANVAS.width
      el.height = CANVAS.height
      el.className = 'game_layer'
      el.setAttribute('style', `z-index: ${i + 1}; display: none;`)
      return el
    })

    const { Engine } = await import('./engine/engine');
    const handlers = {
      handlePause: this.handlePause,
      handleGameOver: () => console.log('Handle game over'),
      setLevel: (value: number) => this.overlay?.handleLevel(value),
      setCombo: (value: number) => this.overlay?.handleCombo(value),
      updateScore: this.handleUpdateScore,
      updateCaught: (value: string) => this.ui?.caught.handleUpdate(value),
      resetCaught: () => this.ui?.caught.handleReset(),
      showTooltip: (value: string) => this.overlay?.handleTooltip(value),
    }
    const initialScore = this.storage.get<number>('data.score')
    const engines = Array.from({ length: 2 }, (_, i) => new Engine({ ctx: canvas[i].getContext('2d')!, handlers }))

    const enginePause = (state: boolean) => {
      engines.forEach((engine) => {
        engine.pause(state)
      })
    }

    this.engineStart = (options1?: EngineOptions, options2?: EngineOptions) => {
      if (options1?.multiplayer) {
        console.log('multiplayer')
        canvas.forEach((el, i) => el.setAttribute('style', `z-index: ${i + 1}; display: block;`))
        engines[0].start(options1)
        engines[1].start(options2)
      } else {
        console.log('single player')
        engines[0].start(options1)
        canvas[1].setAttribute('style', `z-index: 2; display: none;`)
      }
    }

    const engineStop = () => {
      engines.forEach((engine) => {
        engine.stop()
      })
    }

    this.overlay = new Overlay({ enginePause, initialScore })
    this.weather = new Weather()
    this.pause = new PauseModal({
      pause: (state: boolean) => { enginePause(state); this.weather?.pause(state) },
      restart: () => { this.engineStart!({ restart: true }); this.weather?.pause(false) },
      menu: () => { engineStop(); this.menu?.show() },
      confirm: this.confirm
    })

    this.game.append(...canvas, this.overlay.element, this.weather.element, this.pause.element)

    this.focus.addCallbacks({
      focusLoss: () => { enginePause(true); this.weather?.pause(true); },
      focusGain: () => { this.pause?.show(false); enginePause(false); this.weather?.pause(false); }
    })
  }

  private startSinglePlayerGame = (options?: EngineOptions) => {
    this.menu?.show(false)
    this.weather?.pause(false)
    if (this.engineStart) {
      this.engineStart({ fps: this.storage.get<boolean>('fps'), ...options })
    } else {
      this.initGame().then(() => this.engineStart!({ fps: this.storage.get<boolean>('fps'), ...options }))
    }
  }

  private handlePause = (state: boolean) => {
    this.pause?.show(state)
    this.weather?.pause(state)
  }

  private handleUpdateScore = (value: number) => {
    this.overlay?.handleScore(value)
    this.storage.set('data.score', value)
  }

  private onError = ({ source }: { source: TErrorSource }) => (message: string) => {
    const lapse = Date.now() - this.loading.start
    this.errors.push({ source, message, lapse })
    console.error(message, `(${lapse}ms)`)
    if (this.message) {
      const msgEl = document.createElement('div')
      msgEl.innerText = message
      this.message.appendChild(msgEl)
    }
  }
}
