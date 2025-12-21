import { GifFactory, type GifObject } from '~/utils/gif'
import { Injectable } from '~/utils/inject'

const PATH = '.'

const assets: Record<string, string> = {
  cat1: 'sprites/cat-ginger.gif',
  cat2: 'sprites/cat-black.gif',
  // Animal
  bird1: 'sprites/bird-blue.gif',
  bird2: 'sprites/bird-yellow.gif',
  butterfly1: 'sprites/butterfly-orange.gif',
  butterfly2: 'sprites/butterfly-purple.gif',
  grasshopper: 'sprites/grasshopper.gif',
  mouse: 'sprites/mouse.gif',
  frog: 'sprites/frog.gif',
  // Obstacle
  cactus1: 'sprites/cactus1.png',
  cactus2: 'sprites/cactus2.png',
  puddle: 'sprites/water-puddle.png',
  boulder: 'sprites/boulder.png',
  gnome: 'sprites/garden-gnome.png',
  flowerpot: 'sprites/flowerpot.png',
  bucket: 'sprites/bucket.png',
  hedgehog: 'sprites/hedgehog.png',
  dog: 'sprites/dog.png',
  // Scene
  'mountains.layer1': 'scene/mountains/layer1.png',
  'mountains.layer2': 'scene/mountains/layer2.png',
  'mountains.layer3': 'scene/mountains/layer3.png',
  'cliff.layer1': 'scene/cliff/layer1.png',
  'cliff.layer2': 'scene/cliff/layer2.png',
  'cliff.layer3': 'scene/cliff/layer3.png',
  'autumn.layer1': 'scene/autumn/layer1.png',
  'autumn.layer2': 'scene/autumn/layer2.png',
  'autumn.layer3': 'scene/autumn/layer3.png',
  'desert.layer1': 'scene/desert/layer1.png',
  'desert.layer2': 'scene/desert/layer2.png',
  'desert.layer3': 'scene/desert/layer3.png',
  'lake.layer1': 'scene/lake/layer1.png',
  'lake.layer2': 'scene/lake/layer2.png',
  'lake.layer3': 'scene/lake/layer3.png',
  'jungle.layer1': 'scene/jungle/layer1.png',
  'jungle.layer2': 'scene/jungle/layer2.png',
  'jungle.layer3': 'scene/jungle/layer3.png',
  'forest.layer1': 'scene/forest/layer1.png',
  'forest.layer2': 'scene/forest/layer2.png',
  'forest.layer3': 'scene/forest/layer3.png',
  // Menu
  backdrop: 'images/bg_1280.jpg',
  'thumb.mountains': 'scene/mountains.jpg',
  'thumb.cliff': 'scene/cliff.jpg',
  'thumb.autumn': 'scene/autumn.jpg',
  'thumb.desert': 'scene/desert.jpg',
  'thumb.lake': 'scene/lake.jpg',
  'thumb.jungle': 'scene/jungle.jpg',
  'thumb.forest': 'scene/forest.jpg',
}

@Injectable
export class Resource {
  public total: number
  public progress = 0 // 0 - 100 in percents
  private current = 0

  private _progressCallback?: (progress: number) => void
  private _errorCallback?: (message: string) => void
  public sprite: Record<string, ImageBitmap | GifObject> = {}

  constructor() {
    this.total = Object.keys(assets).length
    this.initialize()
  }

  public getImageBitmap = (name: string) => this.sprite[name] as ImageBitmap

  private countOne = () => {
    this.current += 1
    this.progress = Math.floor((this.current / this.total) * 100)
    if (this._progressCallback) {
      this._progressCallback(this.progress)
    }
  }

  private loadGif = (name: string, url: string) => {
    const self = this
    setTimeout(() => {
      const newGif = GifFactory()
      newGif.onerror = function (err) {
        console.log('loading error:', url, err.message)
        if (self._errorCallback) {
          self._errorCallback(`loading error: ${url}`)
        }
      }
      newGif.onloadAll = (/* response */) => {
        /*
        const dimensions = {
          width: response.obj.width,
          height: response.obj.height,
        }
        console.log('Loaded gif:', name, dimensions)
        */
        this.countOne()
      }
      newGif.load(url)

      this.sprite[name] = newGif
      return newGif
    }, 0)
  }

  private loadImg = (name: string, url: string): Promise<ImageBitmap | null> => fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`Failed to fetch: ${url}`)
      return response.blob()
    })
    .then((blob) => createImageBitmap(blob))
    .then((imageBitmap) => {
      this.sprite[name] = imageBitmap
      this.countOne()
      return imageBitmap
    })
    .catch((error) => {
      console.error('Loading/error with image:', url, error)
      if (this._errorCallback) this._errorCallback(`Failed to load image: ${url}`)
      return null
    })

  private initialize = () => {
    const keys = Object.keys(assets)
    for (const key of keys) {
      const fileName = assets[key]
      const ext = fileName.split('.').pop()
      const path = `${PATH}/${fileName}`
      switch (ext) {
        case ('gif'): {
          this.loadGif(key, path)
          break
        }
        case ('png'): {
          this.loadImg(key, path)
          break
        }
        case ('jpg'): {
          this.loadImg(key, path)
          break
        }
        default: {
          break
        }
      }
    }
  }

  public registerCallbacks({ progressCallback, errorCallback }: { progressCallback?: (progress: number) => void, errorCallback?: (message: string) => void }) {
    if (progressCallback) this._progressCallback = progressCallback
    if (errorCallback) this._errorCallback = errorCallback
  }
}
