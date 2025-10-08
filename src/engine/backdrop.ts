import { CANVAS } from '~/const'
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
  isTop?: boolean
  resize?: boolean
}

const layersData: LayersData[] = [
  // { src: 'mountains.layer1', dx: 0, resize: true, isTop: true },
  // { src: 'mountains.layer2', dx: -0.25, resize: true },
  // { src: 'mountains.layer3', dx: -1, resize: true },
  // { src: 'cliff.layer1', dx: -0.1, isTop: true },
  // { src: 'cliff.layer2', dx: -0.25 },
  // { src: 'cliff.layer3', dx: -1 },
  // { src: 'autumn.layer1', dx: 0, isTop: true },
  // { src: 'autumn.layer2', dx: -0.25 },
  // { src: 'autumn.layer3', dx: -1 },
  // { src: 'desert.layer1', dx: 0, resize: true, isTop: true },
  // { src: 'desert.layer2', dx: -0.15 },
  // { src: 'desert.layer3', dx: -1 },
  // { src: 'lake.layer1', dx: 0, resize: true, isTop: true },
  // { src: 'lake.layer2', dx: -0.15, resize: true },
  // { src: 'lake.layer3', resize: true, dx: -1 },
  // { src: 'jungle.layer1', dx: -0.1, resize: true, isTop: true },
  // { src: 'jungle.layer2', dx: -0.5, resize: true, isTop: true },
  // { src: 'jungle.layer3', dx: -1 },
  { src: 'forest.layer1', dx: -0.15, isTop: true },
  { src: 'forest.layer2', dx: -0.35 },
  { src: 'forest.layer3', dx: -1, isTop: true },
]

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
    this.init()
  }

  private init = () => {
    // TODO: Development time patch
    if (this.resource.progress < 100) {
      setTimeout(this.init, 500)
      return
    }

    layersData.forEach(data => {
      const img = getValue(this.resource.sprite, data.src) as HTMLImageElement
      const aspectRatio = img.height / img.width
      const width = data.resize ? CANVAS.width : img.width
      const height = width * aspectRatio
      const layer: Layer = {
        img,
        dx: data.dx,
        width,
        height,
        x: 0,
        y: data.isTop ? 0 : CANVAS.height - height
      }
      this.layersArr.push(layer)
    })
  }

  public draw = (speed = 4) => {
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

  public start(speed = 20) {
    this.stop()
    this.timer = setInterval(this.draw, speed)
  }

  public stop() {
    if (this.timer) clearInterval(this.timer)
  }
}
