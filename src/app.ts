import { Resource } from './engine/resource'
import { CANVAS, type TLevelName } from './const'
import { Weather } from './ui/weather/weather'
import { PauseModal } from './ui/pause/pause'
import { Overlay } from './ui/overlay/overlay'
import { Menu } from './ui/menu/menu'

const autoStart = false

type TErrorSource = 'assets' | 'api'

export class AppView {
  protected root: HTMLDivElement
  protected main!: HTMLElement
  protected loader?: HTMLDivElement
  protected loaderBar?: HTMLDivElement
  protected loaderValue?: HTMLDivElement
  protected message?: HTMLDivElement
  protected errors: { source: TErrorSource, message: string, lapse: number }[] = []

  constructor() {
    const root = document.querySelector<HTMLDivElement>('#app')
    if (root) {
      this.root = root
      this.main = document.createElement('main')
      this.main.className = 'main'

      this.main.setAttribute('style', `width: ${CANVAS.width}px; height: ${CANVAS.height}px;`)
      this.root.append(this.main)
    } else {
      throw new Error('Root element not found')
    }
  }

  protected loaderInit() {
    this.loader = document.createElement('div')
    this.loader.classList.add('loader')
    this.loaderBar = document.createElement('div')
    this.loaderBar.classList.add('loader__bar')
    this.loaderValue = document.createElement('div')
    this.loaderValue.classList.add('loader__value')
    this.loader.append(this.loaderBar, this.loaderValue)

    this.message = document.createElement('div')
    this.message.classList.add('loader__message')

    this.main.append(this.loader, this.message)
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
  private overlay?: Overlay
  private weather?: Weather
  private menu: Menu
  private engineStart?: (levelName?: TLevelName) => void

  constructor() {
    super()
    this.menu = new Menu({ start: this.startGame })
    this.main.append(this.menu.element)
  }

  public init = async (): Promise<void> => {
    this.loaderInit()
    this.main.addEventListener('contextmenu', (event) => {
      event.preventDefault()
      return false
    })

    this.loading.start = Date.now()

    const loaderCallback = (progress: number) => {
      this.loaderUpdate(progress)
      if (progress === 100) {
        console.log(`\x1b[33m${resource.total}\x1b[0m assets loaded in \x1b[33m${Date.now() - this.loading.start}ms\x1b[0m`)
        this.handleLoadComplete()
      }
    }

    const resource = Resource.get(loaderCallback, this.onError({ source: 'assets' }))
  }

  private handleLoadComplete = () => {
    this.loaderRemove()

    if (autoStart) {
      this.initGame()
      return
    }

    if (this.errors.length) {
      return
    }

    this.menu.show()
  }

  private initGame = async (levelName: TLevelName = 'default') => {
    const canvas = document.createElement('canvas')
    canvas.width = CANVAS.width
    canvas.height = CANVAS.height
    canvas.className = 'game_layer'
    canvas.setAttribute('style', 'z-index: 1')

    const { Engine } = await import('./engine/engine');
    const handlers = {
      handlePause: this.handlePause,
      handleGameOver: () => console.log('Handle game over'),
      setLevel: (value: number) => this.overlay?.handleLevel(value),
      setCombo: (value: number) => this.overlay?.handleCombo(value),
      updateScore: (value: number) => this.overlay?.handleScore(value),
      updateCaught: (value: string) => this.overlay?.caught.handleUpdate(value),
      resetCaught: () => this.overlay?.caught.handleReset(),
      showTooltip: (value: string) => this.overlay?.handleTooltip(value),
    }
    const engine = Engine.get({ ctx: canvas.getContext('2d')!, handlers })


    this.overlay = new Overlay({ handlePause: engine.pause })
    this.weather = new Weather()
    this.pause = new PauseModal({
      pause: (state: boolean) => { engine.pause(state); this.weather?.pause(state) },
      restart: () => { engine.start({ restart: true }); this.weather?.pause(false) },
      menu: () => { engine.stop(); this.menu.show() }
    })

    this.main.append(canvas, this.overlay.element, this.weather.element, this.pause.element)

    this.engineStart = (levelName?: TLevelName) => engine.start({ levelName })
    engine.start({ levelName })
  }

  private startGame = (levelName?: TLevelName) => {
    this.menu.show(false)
    this.weather?.pause(false)
    if (this.engineStart) {
      this.engineStart(levelName)
    } else {
      this.initGame(levelName)
    }
  }

  private handlePause = (state: boolean) => {
    this.pause?.show(state)
    this.weather?.pause(state)
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
