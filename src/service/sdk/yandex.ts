import { Injectable } from "~/utils/inject"
import type { SDK } from "./yandex.types"

@Injectable
export class YandexGamesService {
  public sdk?: SDK
  private callbacks: ((sdk: SDK) => void)[] = []

  public init = () => {
    const s = document.createElement('script')
    s.src = "/sdk.js"
    s.async = true
    s.onload = () => {
      // console.log('Yandex SDK loaded.')
      YaGames.init().then(sdk => {
        // console.log('Yandex SDK initialized.')
        this.sdk = sdk
        this.emit(sdk)
      })
    }
    document.body.append(s)
  }

  public initSync = () => {
    let apiReady = false
    this.registerCallback(() => { apiReady = true })
    this.init()

    return new Promise<SDK>((resolve, reject) => {
      let repeats = 10 // 500ms to each
      const readyCheck = () => {
        if (!apiReady && repeats > 0) {
          repeats -= 1
          if (repeats > 0) {
            setTimeout(readyCheck, 500)
            return
          } else {
            reject('Yandex games api initialization timeout.')
          }
        }
        resolve(this.sdk!)
      }
      readyCheck()
    })
  }

  public registerCallback = (callback: (sdk: SDK) => void) => {
    if (this.sdk) {
      callback(this.sdk)
    } else {
      this.callbacks.push(callback)
    }
  }

  private emit = (sdk: SDK) => {
    let callback = this.callbacks.pop()
    while (callback) {
      callback(sdk)
      callback = this.callbacks.pop()
    }
  }
}
