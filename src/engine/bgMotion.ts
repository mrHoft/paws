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
}

const layersData: LayersData[] = [
  { src: 'mountains.layer1', dx: 0, isTop: true },
  { src: 'mountains.layer2', dx: -0.25 },
  { src: 'mountains.layer3', dx: -1 },
]

export class BgMotion {
  private ctx: CanvasRenderingContext2D | null = null
  private timer: number | null = null
  private layersArr: Layer[] = []
  private clearX = CANVAS.width
  private clearY = CANVAS.height
  private static __instance: BgMotion
  private resource = Resource.get()

  constructor({ ctx }: { ctx?: CanvasRenderingContext2D }) {
    if (BgMotion.__instance) {
      if (ctx) BgMotion.__instance.ctx = ctx
      return BgMotion.__instance
    }
    BgMotion.__instance = this
    if (ctx) BgMotion.__instance.ctx = ctx
    this.init()
  }

  private init = () => {
    // TODO: Development time patch
    if (this.resource.progress < 100) {
      setTimeout(this.init, 500)
      return
    }

    layersData.forEach(layer => {
      const img = getValue(this.resource.sprite, layer.src) as HTMLImageElement
      const aspectRatio = img.height / img.width
      const layerObj: Layer = {
        img,
        dx: layer.dx,
        width: CANVAS.width,
        get height(): number {
          return this.width * aspectRatio
        },
        x: 0,
        get y(): number {
          return layer.isTop ? 0 : CANVAS.height - this.height
        },
      }
      this.layersArr.push(layerObj)
    })
  }

  public draw = (speed = 4) => {
    this.ctx?.clearRect(0, 0, this.clearX, this.clearY)
    this.layersArr.forEach(layer => {
      if (layer.x <= -CANVAS.width) {
        layer.x = 0
      }

      if (layer.x > -CANVAS.width) {
        this.ctx?.drawImage(layer.img as CanvasImageSource, CANVAS.width - 1 + layer.x, layer.y, layer.width, layer.height)
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
