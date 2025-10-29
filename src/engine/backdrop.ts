import { CANVAS, type TSceneName } from '~/const'
import { Resource } from './resource'
import { getValue } from '~/utils/data'
import { inject } from '~/utils/inject'

interface Layer {
  img: HTMLImageElement
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
  scale?: number  // 0-1 from canvas height
}

const layersData: Record<TSceneName, LayersData[]> = {
  default: [
    { src: 'mountains.layer1', dx: 0, scale: 0.81, fromTop: true },
    { src: 'mountains.layer2', dx: -0.25, scale: 0.718 },
    { src: 'mountains.layer3', dx: -1, scale: 0.37 },
  ],
  mountains: [
    { src: 'mountains.layer1', dx: 0, scale: 0.81, fromTop: true },
    { src: 'mountains.layer2', dx: -0.25, scale: 0.718 },
    { src: 'mountains.layer3', dx: -1, scale: 0.37 },
  ],
  cliff: [
    { src: 'cliff.layer1', dx: -0.1 },
    { src: 'cliff.layer2', dx: -0.25 },
    { src: 'cliff.layer3', dx: -1 },
  ],
  autumn: [
    { src: 'autumn.layer1', dx: 0 },
    { src: 'autumn.layer2', dx: -0.5 },
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
    { src: 'jungle.layer1', dx: 0, fromTop: true },
    { src: 'jungle.layer2', dx: -0.5, fromTop: true },
    { src: 'jungle.layer3', dx: -1 },
  ],
  forest: [
    { src: 'forest.layer1', dx: -0.15, fromTop: true },
    { src: 'forest.layer2', dx: -0.35 },
    { src: 'forest.layer3', dx: -1 },
  ]
}

export class Backdrop {
  private ctx: CanvasRenderingContext2D | null = null
  private timer: number | null = null
  private layersArr: Layer[] = []
  private clearX = CANVAS.width
  private clearY = CANVAS.height
  private resource: Resource

  constructor({ ctx }: { ctx: CanvasRenderingContext2D }) {
    this.ctx = ctx
    this.resource = inject(Resource)
  }

  public setup = ({ sceneName, multiplayer }: { sceneName: TSceneName, multiplayer?: 'top' | 'bottom' }) => {
    this.layersArr = []
    layersData[sceneName].forEach(data => {
      const img = getValue(this.resource.sprite, data.src) as HTMLImageElement
      const aspectRatio = img.width / img.height
      let height = CANVAS.height * (data.scale || 1)
      if (multiplayer) height = height / 2
      const width = (height * aspectRatio) > CANVAS.width ? height * aspectRatio : CANVAS.width

      let y = 0
      if (multiplayer === 'top') {
        y = data.fromTop ? 0 : CANVAS.height / 2 - height
      } else if (multiplayer === 'bottom') {
        y = data.fromTop ? CANVAS.height / 2 : CANVAS.height - height
      } else {
        y = data.fromTop ? 0 : CANVAS.height - height
      }

      const layer: Layer = {
        img,
        dx: data.dx,
        width,
        height,
        x: 0,
        y
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
        this.ctx?.drawImage(layer.img, layer.width - 2 + layer.x, layer.y, layer.width, layer.height)
      }

      this.ctx?.drawImage(layer.img, layer.x, layer.y, layer.width, layer.height)
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
