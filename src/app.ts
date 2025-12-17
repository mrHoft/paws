import { Resource } from '~/engine/resource'
import { GENERAL, type TSceneName } from '~/const'
import { Weather } from '~/ui/weather/weather'
import { PauseModal } from '~/ui/pause/pause'
import { ConfirmationModal } from '~/ui/confirmation/confirm'
import { StageCompleteModal } from '~/ui/stage-complete/stageComplete'
import { WinModal } from '~/ui/win/win'
import { SinglePlayerUI } from '~/ui/game-ui/singlePlayer'
import { MultiplayerUI } from '~/ui/game-ui/multiplayer'
import { SettingsUI } from '~/ui/settings/settings'
import { LoaderUI } from '~/ui/loader/loader'
import { MainMenu } from '~/ui/menu/main'
import { AboutUI } from '~/ui/about/about'
import { UpgradeUI } from '~/ui/upgrade/upgrade'
import { LeaderboardUI } from '~/ui/leaderboard/leaderboard'
import { AchievementsUI } from '~/ui/achievements/achievements'
import { Storage } from '~/service/storage'
import { Message } from '~/ui/message/message'
import { AudioService } from '~/service/audio'
import { ShepardTone, type ShepardToneConfig } from '~/service/shepardTone'
import { SoundService } from "~/service/sound";
import { Localization } from '~/service/localization'
import { WindowFocusService } from '~/service/focus'
import { YandexGamesService } from '~/service/sdk.yandex/sdk'
import { MultiplayerMenu } from '~/ui/menu/multiplayer'
import { Caught } from '~/ui/caught/caught'
import { injector, inject } from '~/utils/inject'
import type { EngineOptions, EngineHandlers, TUpgrades } from '~/engine/types'
import { debounce } from '~/utils/throttle'

const autoStartScene: TSceneName | null = null  // 'lake'

type TErrorSource = 'assets' | 'api'

export class AppView {
  protected root: HTMLDivElement
  protected game: HTMLDivElement
  protected errors: { source: TErrorSource, message: string, lapse: number }[] = []

  constructor() {
    const root = document.querySelector<HTMLDivElement>('#app')
    if (root) {
      this.root = root
      const main = document.createElement('main')
      main.className = 'main'
      main.setAttribute('style', `max-width: ${GENERAL.canvas.width}px; max-height: ${GENERAL.canvas.height}px;`)

      this.game = document.createElement('div')
      this.game.className = 'game'
      this.game.setAttribute('style', `aspect-ratio: ${GENERAL.canvas.aspectRatio};`)
      main.append(this.game)

      this.root.append(main)
    } else {
      throw new Error('Root element not found')
    }
  }
}

export class App extends AppView {
  private loading = { start: 0 }
  private loc: Localization
  private pauseModal?: PauseModal
  private confirmationModal?: ConfirmationModal
  private winModal?: WinModal
  private stageCompleteModal?: StageCompleteModal
  private singlePlayerUI?: SinglePlayerUI
  private multiplayerUI?: MultiplayerUI
  private settingsUI?: SettingsUI
  private loaderUI?: LoaderUI
  private weather?: Weather
  private audioService: AudioService
  private mainMenu?: MainMenu
  private storage: Storage
  private focusService: WindowFocusService
  private yandexGames?: YandexGamesService
  private caught?: Caught
  private engineStart?: (options1?: EngineOptions, options2?: EngineOptions) => void
  private enginePause?: (state: boolean, force?: boolean) => void
  private engineStop?: () => void
  private canvas: HTMLCanvasElement[] = []
  private multiplayer: { options1?: EngineOptions, options2?: EngineOptions } | null = null

  constructor() {
    super()
    this.storage = inject(Storage)
    // console.log("Saved score:", this.storage.get<number>('data.score'))
    this.loc = injector.createInstance(Localization, this.storage.get('language'))

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
    this.audioService = injector.createInstance(AudioService, { music, sound })

    const config: ShepardToneConfig = {
      baseFrequency: 220,
      numOscillators: 2,
      cycleDuration: 6.0,
      oscillatorType: 'sine',
      volume: soundVolume,
      direction: 'ascending'
    }
    const tone = injector.createInstance(ShepardTone, config)

    const soundService = injector.createInstance(SoundService)
    soundService.volume = soundVolume

    this.focusService = new WindowFocusService()
    this.focusService.registerCallback({
      focusLoss: () => { this.audioService.mute = true; soundService.mute = true; tone.stop() },
      focusGain: () => { this.audioService.mute = false; soundService.mute = false }
    })

    if (GENERAL.sdk === 'yandex-games') {
      this.yandexGames = inject(YandexGamesService)
      this.yandexGames.init()
    }
  }

  public init = async (): Promise<void> => {
    this.loaderUI = new LoaderUI()
    this.game.append(this.loaderUI.element)

    let repeats = 10 // 500ms to each
    let apiReady = true
    if (GENERAL.sdk === 'ya-games') {
      apiReady = false
      this.yandexGames?.registerCallback((sdk) => {
        sdk.features.LoadingAPI.ready()
        apiReady = true
      })
    }

    this.loading.start = Date.now()

    const handleError = ({ source }: { source: TErrorSource }) => (message: string) => {
      const lapse = Date.now() - this.loading.start
      this.errors.push({ source, message, lapse })
      console.error(message, `(${lapse}ms)`)

      const msgEl = document.createElement('div')
      msgEl.innerText = message
      this.loaderUI?.addMessage(msgEl)
    }

    const handleReady = () => {
      if (!apiReady && repeats > 0) {
        repeats -= 1
        if (repeats > 0) {
          setTimeout(handleReady, 500)
          return
        } else {
          if (GENERAL.sdk === 'ya-games') {
            handleError({ source: 'api' })('Yandex games api initialization timeout.')
          }
        }
      }

      this.start()
    }

    const handleProgress = (progress: number) => {
      this.loaderUI?.progressUpdate(progress)

      if (progress === 100) {
        console.log(`\x1b[33m${resource.total}\x1b[0m assets loaded in \x1b[33m${Date.now() - this.loading.start}ms\x1b[0m`)
        handleReady()
      }
    }

    const resource = injector.createInstance(Resource)
    resource.registerCallbacks({ progressCallback: handleProgress, errorCallback: handleError({ source: 'assets' }) })

    this.registerEvents()
  }

  private start = () => {
    if (this.errors.length) return
    this.loaderUI?.destroy()

    this.caught = inject(Caught)
    this.singlePlayerUI = injector.createInstance(SinglePlayerUI, { enginePause: this.handleEnginePause })
    this.multiplayerUI = new MultiplayerUI()
    this.confirmationModal = injector.createInstance(ConfirmationModal)
    const aboutUI = injector.createInstance(AboutUI)
    this.settingsUI = injector.createInstance(SettingsUI)
    const upgradeUI = injector.createInstance(UpgradeUI)
    const leaderboardUI = injector.createInstance(LeaderboardUI)
    const achievementsUI = injector.createInstance(AchievementsUI)
    const multiplayerMenu = injector.createInstance(MultiplayerMenu, { startMultiplayerGame: this.startMultiplayerGame })
    this.mainMenu = new MainMenu({ startSinglePlayerGame: this.startSinglePlayerGame })
    this.pauseModal = new PauseModal({
      pause: (state: boolean) => { this.handleEnginePause(state); this.weather?.pause(state) },
      restart: this.handleEngineRestart,
      menu: this.handleMenuShow
    })
    this.canvas = Array.from({ length: 2 }, (_, i) => {
      const el = document.createElement('canvas')
      el.width = GENERAL.canvas.width
      el.height = GENERAL.canvas.height
      el.className = `game_layer${i + 1}`
      el.setAttribute('style', 'display: none;')
      return el
    })
    this.weather = new Weather()
    this.weather?.element.setAttribute('style', 'display: none;')
    this.stageCompleteModal = new StageCompleteModal({ menu: this.handleMenuShow, sceneUpdate: this.mainMenu.sceneUpdate })
    this.winModal = new WinModal({
      restart: this.handleEngineRestart,
      menu: this.handleMenuShow
    })
    const message = inject(Message)

    this.game.append(
      ...this.canvas,
      this.weather.element,
      this.mainMenu.element,
      this.singlePlayerUI.element,
      this.multiplayerUI.element,
      upgradeUI.element,
      leaderboardUI.element,
      achievementsUI.element,
      multiplayerMenu.element,
      aboutUI.element,
      this.settingsUI.element,
      this.stageCompleteModal.element,
      this.winModal.element,
      this.pauseModal.element,
      this.confirmationModal.element,
      message.element
    )

    this.yandexGames?.registerCallback((sdk) => {
      const lang = sdk.environment.i18n.lang
      if (lang) {
        this.loc.language = lang
        this.settingsUI?.setLanguage(lang)
      }
    })

    if (autoStartScene) {
      this.initGame().then(() => {
        this.engineStart!(
          { sceneName: autoStartScene },
          // { sceneName: autoStartScene, multiplayer: 'top' },
          // { sceneName: autoStartScene, multiplayer: 'bottom', control: 'keyboard' }
        )
      })
      return
    }

    this.handleMenuShow()
  }

  private registerEvents = () => {
    // document.addEventListener('contextmenu', (event) => { event.preventDefault() })
    // document.addEventListener('touchmove', (event) => { event.preventDefault() }, { passive: false });

    const resizeCallback = debounce(() => {
      const { width, height } = this.root.getBoundingClientRect()
      let newWidth = Math.min(width, GENERAL.canvas.width)
      const newHeight = Math.floor(Math.min(height, GENERAL.canvas.height, newWidth / GENERAL.canvas.aspectRatio))
      if (newHeight * GENERAL.canvas.aspectRatio < newWidth) {
        newWidth = Math.floor(newHeight * GENERAL.canvas.aspectRatio)
      }
      this.game.setAttribute('style', `width: ${newWidth}px; height: ${newHeight}px;`)
    })
    window.addEventListener('resize', resizeCallback)
    setTimeout(resizeCallback, 0);
  }

  private initGame = async () => {
    const { Engine } = await import('./engine/engine');
    const handlers: EngineHandlers = {
      handlePause: (state: boolean) => {
        this.enginePause!(true, true)
        this.pauseModal?.show(state)
        this.weather?.pause(state)
      },
      updateCombo: this.handleUpdateCombo,
      updateScore: this.handleUpdateScore,
      updateProgress: this.handleUpdateProgress,
      updateCaught: (value: string) => this.caught?.handleUpdate(value),
      showTooltip: (value: string) => this.singlePlayerUI?.handleTooltip(value),
      handleFinish: (result: { scene: string, score: number, time: number, caught?: number, player?: 'top' | 'bottom' }) => {
        this.enginePause!(true, true)
        if (result.player) {
          this.winModal?.handleFinish(result)
        } else {
          this.stageCompleteModal?.handleComplete(result)
        }
      },
      renderCallback: () => { this.handleSdkApiState(true) }
    }
    const engines = Array.from({ length: 2 }, (_, i) => new Engine({ ctx: this.canvas[i].getContext('2d')!, handlers }))

    this.enginePause = (state: boolean, force = false) => {
      engines.forEach((engine) => {
        engine.pause(state, force)
      })
      this.handleSdkApiState(!state)
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
        const upgrades = this.storage.get<TUpgrades>(`data.upgrades`)
        this.singlePlayerUI?.toggleView('single-player')
        engines[0].start({ ...options1, upgrades })
        this.canvas[0].removeAttribute('style')
        this.canvas[1].setAttribute('style', 'display: none;')
      }
    }

    this.engineStop = () => {
      engines.forEach((engine) => {
        engine.stop()
      })
      this.handleSdkApiState(false)
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
        this.engineStart()
      }
      this.weather?.pause(false);
      if (!this.multiplayer) {
        this.caught?.handleReset()
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
  }

  private handleUpdateCombo = (value: number, player?: 'top' | 'bottom') => {
    this.singlePlayerUI?.handleCombo(value)
    this.multiplayerUI?.handleCombo(value, player)
  }

  private handleUpdateProgress = (value: number, player?: 'top' | 'bottom') => {
    this.singlePlayerUI?.handleProgress(value)
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
    this.mainMenu?.show()
  }

  private handleSdkApiState = (state: boolean) => {
    console.log('Gameplay API:', state ? 'start' : 'stop')
    if (state) {
      this.yandexGames?.sdk?.features.GameplayAPI.start()
    } else {
      this.yandexGames?.sdk?.features.GameplayAPI.stop()
    }
  }
}
