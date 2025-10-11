import { CANVAS, type TLevelName } from '~/const'
import { Resource } from './resource'
import { getValue } from '~/utils/data'

interface Layer {
  img: HTMLImageElement | null
  x: number
  y: number
  dx: number
  width: number
  height: number
}

interface LayersData {
  src: string
  dx: number
  fromTop?: boolean
}

const layersData: Record<TLevelName, LayersData[]> = {
  default: [
    { src: 'mountains.layer1', dx: 0, fromTop: true },
    { src: 'mountains.layer2', dx: -0.25 },
    { src: 'mountains.layer3', dx: -1 },
  ],
  mountains: [
    { src: 'mountains.layer1', dx: 0, fromTop: true },
    { src: 'mountains.layer2', dx: -0.25 },
    { src: 'mountains.layer3', dx: -1 },
  ],
  cliff: [
    { src: 'cliff.layer1', dx: -0.1, fromTop: true },
    { src: 'cliff.layer2', dx: -0.25, fromTop: true },
    { src: 'cliff.layer3', dx: -1 },
  ],
  autumn: [
    { src: 'autumn.layer1', dx: 0, fromTop: true },
    { src: 'autumn.layer2', dx: -0.25, fromTop: true },
    { src: 'autumn.layer3', dx: -1 },
  ],
  desert: [
    { src: 'desert.layer1', dx: 0, fromTop: true },
    { src: 'desert.layer2', dx: -0.15 },
    { src: 'desert.layer3', dx: -1 },
  ],
  lake: [
    { src: 'lake.layer1', dx: 0, fromTop: true },
    { src: 'lake.layer2', dx: -0.15 },
    { src: 'lake.layer3', dx: -1 },
  ],
  jungle: [
    { src: 'jungle.layer1', dx: -0.1, fromTop: true },
    { src: 'jungle.layer2', dx: -0.5, fromTop: true },
    { src: 'jungle.layer3', dx: -1 },
  ],
  forest: [
    { src: 'forest.layer1', dx: -0.15, fromTop: true },
    { src: 'forest.layer2', dx: -0.35 },
    { src: 'forest.layer3', dx: -1, fromTop: true },
  ]
}

export class Backdrop {
  private ctx: CanvasRenderingContext2D | null = null
  private timer: number | null = null
  private layersArr: Layer[] = []
  private clearX = CANVAS.width
  private clearY = CANVAS.height
  private static __instance: Backdrop
  private resource = Resource.get()

  constructor({ ctx }: { ctx?: CanvasRenderingContext2D }) {
    if (Backdrop.__instance) {
      if (ctx) Backdrop.__instance.ctx = ctx
      return Backdrop.__instance
    }
    Backdrop.__instance = this
    if (ctx) Backdrop.__instance.ctx = ctx
  }

  public init = (levelName: TLevelName) => {
    // TODO: Development time patch
    if (this.resource.progress < 100) {
      setTimeout(this.init, 500)
      return
    }

    this.layersArr = []
    layersData[levelName].forEach(data => {
      const img = getValue(this.resource.sprite, data.src) as HTMLImageElement
      const aspectRatio = img.height / img.width
      const width = img.width < CANVAS.width ? CANVAS.width : img.width
      const height = width * aspectRatio
      const layer: Layer = {
        img,
        dx: data.dx,
        width,
        height,
        x: 0,
        y: data.fromTop ? 0 : CANVAS.height - height
      }
      this.layersArr.push(layer)
    })
  }

  public move = (speed = 4) => {
    this.ctx?.clearRect(0, 0, this.clearX, this.clearY)
    this.layersArr.forEach(layer => {
      if (layer.x <= -layer.width) {
        layer.x = 0
      }

      if (layer.x > -layer.width) {
        this.ctx?.drawImage(layer.img as CanvasImageSource, layer.width - 2 + layer.x, layer.y, layer.width, layer.height)
      }

      this.ctx?.drawImage(layer.img as CanvasImageSource, layer.x, layer.y, layer.width, layer.height)
      layer.x += speed * layer.dx
    })
  }

  public draw = () => this.move(0)

  public start(speed = 20) {
    this.stop()
    this.timer = setInterval(this.move, speed)
  }

  public stop() {
    if (this.timer) clearInterval(this.timer)
  }
}
