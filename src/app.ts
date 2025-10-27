import { Resource } from '~/engine/resource'
import { CANVAS, type TSceneName } from '~/const'
import { Weather } from '~/ui/weather/weather'
import { PauseModal } from '~/ui/pause/pause'
import { ConfirmationModal } from './ui/confirmation/confirm'
import { WinModal } from './ui/win/win'
import { SinglePlayerUI } from '~/ui/game-ui/singlePlayer'
import { MultiplayerUI } from './ui/game-ui/multiplayer'
import { SettingsUI } from '~/ui/settings/settings'
import { MainMenu } from '~/ui/menu/main'
import { AboutUI } from '~/ui/about/about'
import { Storage } from '~/service/storage'
import { Audio } from '~/service/audio'
import { ShepardTone, type ShepardToneConfig } from './service/shepardTone'
import { Localization } from '~/service/localization'
import { WindowFocusService } from '~/service/focus'
import { MultiplayerMenu } from '~/ui/menu/multiplayer'
import { injector, inject } from '~/utils/inject'
import type { EngineOptions, EngineHandlers } from '~/engine/types'

const autoStartScene: TSceneName | null = null//'autumn'

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
  private pauseModal?: PauseModal
  private confirmationModal?: ConfirmationModal
  private winModal?: WinModal
  private singlePlayerUI?: SinglePlayerUI
  private multiplayerUI?: MultiplayerUI
  private settingsUI?: SettingsUI
  private weather?: Weather
  private audio: Audio
  private mainMenu?: MainMenu
  private storage: Storage
  private focusService: WindowFocusService
  private engineStart?: (options1?: EngineOptions, options2?: EngineOptions) => void
  private enginePause?: (state: boolean, force?: boolean) => void
  private engineStop?: () => void
  private canvas: HTMLCanvasElement[] = []
  private multiplayer: { options1?: EngineOptions, options2?: EngineOptions } | null = null

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

    this.focusService = new WindowFocusService()
    this.focusService.registerCallback({
      focusLoss: () => { this.audio.mute = true },
      focusGain: () => { this.audio.mute = false }
    })
  }

  public init = async (): Promise<void> => {
    this.loaderInit()
    this.root.addEventListener('contextmenu', (event) => {
      // event.preventDefault()
      return false
    })

    this.loading.start = Date.now()

    const onProgress = (progress: number) => {
      this.loaderUpdate(progress)
      if (progress === 100) {
        console.log(`\x1b[33m${resource.total}\x1b[0m assets loaded in \x1b[33m${Date.now() - this.loading.start}ms\x1b[0m`)
        this.handleLoadComplete()
      }
    }

    const onError = ({ source }: { source: TErrorSource }) => (message: string) => {
      const lapse = Date.now() - this.loading.start
      this.errors.push({ source, message, lapse })
      console.error(message, `(${lapse}ms)`)
      if (this.message) {
        const msgEl = document.createElement('div')
        msgEl.innerText = message
        this.message.appendChild(msgEl)
      }
    }

    const resource = injector.createInstance(Resource)
    resource.registerCallbacks({ progressCallback: onProgress, errorCallback: () => onError({ source: 'assets' }) })
  }

  private handleLoadComplete = () => {
    this.loaderRemove()

    const initialScore = this.storage.get<number>('data.score')
    this.singlePlayerUI = injector.createInstance(SinglePlayerUI, { enginePause: this.handleEnginePause, initialScore })
    this.multiplayerUI = new MultiplayerUI()
    this.confirmationModal = injector.createInstance(ConfirmationModal)
    const aboutUI = injector.createInstance(AboutUI)
    this.settingsUI = injector.createInstance(SettingsUI)
    const multiplayerMenu = injector.createInstance(MultiplayerMenu, { startMultiplayerGame: this.startMultiplayerGame })
    this.mainMenu = new MainMenu({ startSinglePlayerGame: this.startSinglePlayerGame })
    this.pauseModal = new PauseModal({
      pause: (state: boolean) => { this.handleEnginePause(state); this.weather?.pause(state) },
      restart: this.handleEngineRestart,
      menu: this.handleMenuShow
    })
    this.canvas = Array.from({ length: 2 }, (_, i) => {
      const el = document.createElement('canvas')
      el.width = CANVAS.width
      el.height = CANVAS.height
      el.className = `game_layer${i + 1}`
      el.setAttribute('style', 'display: none;')
      return el
    })
    this.weather = new Weather()
    this.weather?.element.setAttribute('style', 'display: none;')
    this.winModal = new WinModal({
      restart: this.handleEngineRestart,
      menu: this.handleMenuShow
    })

    this.game.append(
      ...this.canvas,
      this.weather.element,
      this.mainMenu.element,
      this.singlePlayerUI.element,
      this.multiplayerUI.element,
      multiplayerMenu.element,
      aboutUI.element,
      this.settingsUI.element,
      this.winModal.element,
      this.pauseModal.element,
      this.confirmationModal.element,
    )

    if (autoStartScene) {
      this.initGame().then(() => {
        this.engineStart!(
          { sceneName: autoStartScene, multiplayer: 'top' },
          { sceneName: autoStartScene, multiplayer: 'bottom', control: 'keyboard' })
      })
      return
    }

    if (this.errors.length) {
      return
    }

    this.handleMenuShow()
  }

  private initGame = async () => {
    const { Engine } = await import('./engine/engine');
    const handlers: EngineHandlers = {
      handlePause: (state: boolean) => { this.pauseModal?.show(state); this.weather?.pause(state) },
      handleGameOver: () => console.log('Handle game over'),
      updateLevel: (value: number) => this.singlePlayerUI?.handleLevel(value),
      updateCombo: this.handleUpdateCombo,
      updateScore: this.handleUpdateScore,
      updateProgress: this.handleUpdateProgress,
      updateCaught: (value: string) => this.singlePlayerUI?.caught.handleUpdate(value),
      showTooltip: (value: string) => this.singlePlayerUI?.handleTooltip(value),
      handleFinish: (result: { score: number, time: number, player: 'top' | 'bottom' }) => {
        this.enginePause!(true, true)
        this.winModal?.handleFinish(result)
      }
    }
    const engines = Array.from({ length: 2 }, (_, i) => new Engine({ ctx: this.canvas[i].getContext('2d')!, handlers }))

    this.enginePause = (state: boolean, force = false) => {
      engines.forEach((engine) => {
        engine.pause(state, force)
      })
    }

    this.engineStart = (options1?: EngineOptions, options2?: EngineOptions) => {
      this.weather?.element.removeAttribute('style')
      if (options1?.multiplayer) {
        this.multiplayer = { options1, options2 }
        this.singlePlayerUI?.toggleView('multiplayer')
        this.multiplayerUI?.show(true)
        this.multiplayerUI?.startCount()
        this.canvas.forEach((el) => el.removeAttribute('style'))
        engines[0].start(options1)
        engines[1].start(options2)
      } else {
        this.singlePlayerUI?.toggleView('single-player')
        engines[0].start(options1)
        this.canvas[0].removeAttribute('style')
        this.canvas[1].setAttribute('style', 'display: none;')
      }
    }

    this.engineStop = () => {
      engines.forEach((engine) => {
        engine.stop()
      })
    }

    this.settingsUI?.registerCallback({
      engineSettings: (settings: { fps?: boolean }) => {
        engines[0].settings.set(settings)
      }
    })

    this.focusService.registerCallback({
      focusLoss: () => {
        if (engines[0].isActive) {
          this.handleEnginePause(true);
          this.weather?.pause(true);
        }
      },
      // focusGain: () => { this.pauseModal?.show(false); this.handleEnginePause(false); this.weather?.pause(false); }
    })
  }

  private startSinglePlayerGame = (options1?: EngineOptions) => {
    this.mainMenu?.show(false)
    this.weather?.pause(false)
    const initialScore = this.storage.get<number>('data.score')
    const options = { fps: this.storage.get<boolean>('fps'), ...options1, initialScore }
    if (this.engineStart) {
      this.engineStart(options)
    } else {
      this.initGame().then(() => this.engineStart!(options))
    }
  }

  private startMultiplayerGame = (options1: EngineOptions, options2: EngineOptions) => {
    this.mainMenu?.show(false)
    this.weather?.pause(false)
    if (this.engineStart) {
      this.engineStart(options1, options2)
    } else {
      this.initGame().then(() => this.engineStart!(options1, options2))
    }
  }

  private handleEngineRestart = () => {
    if (this.engineStart) {
      if (this.multiplayer) {
        this.engineStart(this.multiplayer.options1, this.multiplayer.options2)
      } else {
        this.engineStart({ restart: true })
      }
      this.weather?.pause(false);
      if (!this.multiplayer) {
        this.singlePlayerUI?.caught.handleReset()
      }
    }
  }

  private handleEnginePause = (state: boolean) => {
    if (this.enginePause) {
      this.enginePause(state)
    }
  }

  private handleUpdateScore = (value: number, player?: 'top' | 'bottom') => {
    this.singlePlayerUI?.handleScore(value)
    this.multiplayerUI?.handleScore(value, player)
    if (!player) {
      this.storage.set('data.score', value)
    }
  }

  private handleUpdateCombo = (value: number, player?: 'top' | 'bottom') => {
    this.singlePlayerUI?.handleCombo(value)
    this.multiplayerUI?.handleCombo(value, player)
  }

  private handleUpdateProgress = (value: number, player?: 'top' | 'bottom') => {
    // this.singlePlayerUI?.handleProgress(value)
    this.multiplayerUI?.handleProgress(value, player)
  }

  private handleMenuShow = () => {
    if (this.engineStop) this.engineStop();
    this.singlePlayerUI?.toggleView('menu')
    this.multiplayerUI?.show(false)
    this.canvas.forEach(el => el.setAttribute('style', 'display: none;'))
    this.multiplayer = null
    this.weather?.pause(true)
    this.weather?.element.setAttribute('style', 'display: none;')
    this.mainMenu?.show();
  }
}
