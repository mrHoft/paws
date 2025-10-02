// @ts-ignore
import GIF from '../utils/gif.js'
import { setValue } from '../utils/data.js'

const PATH = ''

const assets: Record<string, string> = {
  cat: 'sprites/cat-orange.gif',
  cactus: 'sprites/cactus-green.png',
  puddle: 'sprites/water-puddle.png',
  bird: 'sprites/bird-yellow.gif',
  butterfly: 'sprites/butterfly-orange.gif',
  flowerpot: 'sprites/flowerpot-empty.png',
  gnome: 'sprites/garden-gnome.png',
  grasshopper: 'sprites/grasshopper.gif',
  mouse: 'sprites/mouse-brown.gif',
  'MistyMountains.layer1': 'MistyMountains/layer_1.png',
  'MistyMountains.layer2': 'MistyMountains/layer_2.png',
  'MistyMountains.layer3': 'MistyMountains/layer_3.png',
}

export type TGifObject = {
  onerror: (e: any) => void
  load: (url: string) => void
  onloadall: (res: { type: 'loadall'; obj: TGifObject }) => void
  frames: { image: HTMLCanvasElement }[]
  loading: any
  image: HTMLCanvasElement
  lastFrame: { image: HTMLCanvasElement } | null
  width: number
  height: number
  src: string
  currentFrame: number
  frameCount: number
}

export class Resource {
  public total: number
  public progress = 0 // 0 - 100 in percents
  private current = 0

  protected static __instance: Resource
  protected static _initialized = false
  protected static _progressCallback: (progress: number) => void
  protected static _errorCallback: (message: string) => void
  public sprite: Record<string, HTMLImageElement | TGifObject> = {}

  private constructor() {
    this.total = Object.keys(assets).length
    this.initialize()
  }

  private countOne = () => {
    this.current += 1
    this.progress = Math.floor((this.current / this.total) * 100)
    Resource._progressCallback(this.progress)
  }

  private loadGif = (name: string, url: string) => {
    // Timeout just waits till script has been parsed and executed then starts loading a gif
    setTimeout(() => {
      const newGif: TGifObject = GIF() // creates a new gif
      newGif.onerror = function (err) {
        console.log('Gif loading error ' + err.type)
        if (Resource._errorCallback) {
          Resource._errorCallback(`Img loading error: ${err.type}`)
        }
      }
      newGif.onloadall = res => {
        const dimensions = {
          width: res.obj.width,
          height: res.obj.height,
        }
        console.log('Loaded gif:', name, dimensions)
        this.countOne()
      }
      newGif.load(url)

      this.sprite[name] = newGif
      return newGif
    }, 0)
  }

  private loadImg = (name: string, url: string): HTMLImageElement => {
    const newImg = document.createElement('img')
    newImg.src = url
    newImg.onload = () => {
      const dimensions = {
        width: newImg.width,
        height: newImg.height,
      }
      console.log('Loaded img:', name, dimensions)
      this.countOne()
    }
    newImg.onerror = function (error) {
      console.log('Img loading error:', error)
      if (Resource._errorCallback) {
        Resource._errorCallback(`Img loading error: ${name}`)
      }
    }
    setValue(this.sprite, name, newImg)
    return newImg
  }

  public initialize = () => {
    if (!Resource._initialized) {
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
          default: {
            break
          }
        }
      }
    }
  }

  public static get(progressCallback?: (progress: number) => void, errorCallback?: (message: string) => void) {
    if (Resource.__instance) return Resource.__instance
    if (progressCallback) Resource._progressCallback = progressCallback
    if (errorCallback) Resource._errorCallback = errorCallback
    return (Resource.__instance = new Resource())
  }
}

/* Callback example
const tempCallback = (progress: number) => {
  console.log(`Resource loading: ${progress}%`)
}
*/

export default Resource
