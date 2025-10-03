import { Resource } from './engine/resource'
import { CANVAS } from './const'

const autoStart = true

interface MenuItem { id: string, title: string, func: () => void }
type TErrorSource = 'assets' | 'api'

export class AppView {
  protected root: HTMLDivElement
  protected main!: HTMLElement
  protected menu?: HTMLDivElement
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
      this.root.append(this.main)
    } else {
      throw new Error('Root element not found')
    }
  }

  protected menuInit(menuItems: MenuItem[]) {
    this.menu = document.createElement('div')
    this.menu.classList.add('menu')
    for (const item of menuItems) {
      const button = document.createElement('button')
      button.innerText = item.title
      button.onclick = item.func
      this.menu.append(button)
    }

    this.main.append(this.menu)
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

  public init = async (): Promise<void> => {
    this.loaderInit()

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
      this.startGame()
      return
    }

    if (this.errors.length) {
      return
    }

    const menuItems = [
      { id: 'start', title: 'Start', func: this.startGame },
    ]
    this.menuInit(menuItems)
  }

  private startGame = async () => {
    this.main.innerHTML = ''

    const bgCanvas = document.createElement('canvas')
    bgCanvas.width = CANVAS.width
    bgCanvas.height = CANVAS.height
    bgCanvas.setAttribute('style', 'z-index: 1')
    bgCanvas.addEventListener('contextmenu', (event) => {
      event.preventDefault()
      return false
    })

    const gameCanvas = document.createElement('canvas')
    gameCanvas.width = CANVAS.width
    gameCanvas.height = CANVAS.height
    gameCanvas.className = 'game_layer'
    gameCanvas.setAttribute('style', 'z-index: 2')
    gameCanvas.addEventListener('contextmenu', (event) => {
      event.preventDefault()
      return false
    })
    this.main.append(bgCanvas, gameCanvas)

    const { BgMotion } = await import('./engine/bgMotion');
    new BgMotion({ ctx: bgCanvas.getContext('2d')! })

    const { Engine } = await import('./engine/engine');
    const handlers = {
      setPauseVisible: () => console.log('Handle pause'),
      handleGameOver: () => console.log('Handle game over'),
      setLevel: () => console.log('Handle level'),
      setCombo: () => console.log('Handle combo'),
      setTooltip: () => console.log('Handle tooltip'),
      updateScore: () => console.log('Handle score'),
      updateCaught: () => console.log('Handle catch'),
    }
    const engine = Engine.get({ ctx: gameCanvas.getContext('2d')!, handlers })
    engine.start()
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
