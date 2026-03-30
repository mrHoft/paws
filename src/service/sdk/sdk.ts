import { Injectable } from "~/utils/inject"
import type { TSDK, GetLeaderboardEntriesOpts, LeaderboardEntriesData } from "./types"
import type { YandexGamesSDK } from "./yandex.types"
import type { CrazyGamesSDK } from "./crazyGames.types"
import { GENERAL } from "~/const"

const SDK_SRC: Record<TSDK, string> = {
  yandexGames: '/sdk.js',
  crazyGames: 'https://sdk.crazygames.com/crazygames-sdk-v3.js'
}

@Injectable
export class SDKService {
  public sdk: { yandexGames: YandexGamesSDK | null, crazyGames: CrazyGamesSDK | null } = { yandexGames: null, crazyGames: null }
  private callbacks: (() => void)[] = []
  private ready: { status: boolean, error: string | null } = { status: false, error: null }

  public loading = {
    start: () => {
      if (GENERAL.sdk === 'crazyGames' && this.sdk.crazyGames) {
        this.sdk.crazyGames.game.loadingStart()
      }
    },
    ready: () => {
      if (GENERAL.sdk === 'yandexGames' && this.sdk.yandexGames) {
        this.sdk.yandexGames.features.LoadingAPI.ready()
      }
      if (GENERAL.sdk === 'crazyGames' && this.sdk.crazyGames) {
        this.sdk.crazyGames.game.loadingStop()
      }
    }
  }

  public leaderboards = {
    getEntries: (leaderboardName: string, opts?: GetLeaderboardEntriesOpts): Promise<LeaderboardEntriesData> => {
      if (GENERAL.sdk === 'yandexGames' && this.sdk.yandexGames) {
        return this.sdk.yandexGames.leaderboards.getEntries(leaderboardName, opts)
      }
      return new Promise((resolve) => {
        setTimeout(() => resolve({ entries: [] }), 500)
      })
    },
    setScore: (leaderboardName: string, score: number, extraData?: string): Promise<void> => {
      if (GENERAL.sdk === 'yandexGames' && this.sdk.yandexGames) {
        return this.sdk.yandexGames.leaderboards.setScore(leaderboardName, score, extraData)
      }
      return Promise.resolve()
    }
  }

  public settings = {
    muteAudio: () => {
      if (GENERAL.sdk === 'crazyGames' && this.sdk.crazyGames) {
        return this.sdk.crazyGames.game.settings.muteAudio
      }
      return null
    },
    get isAudioMuted() { return this.muteAudio() },
    addSettingsChangeListener: (listener: (newSettings: { muteAudio: boolean }) => void) => {
      if (GENERAL.sdk === 'crazyGames' && this.sdk.crazyGames) {
        return this.sdk.crazyGames.game.addSettingsChangeListener(listener)
      }
    }
  }

  public get lang() {
    if (GENERAL.sdk === 'yandexGames' && this.sdk.yandexGames) {
      return this.sdk.yandexGames.environment.i18n.lang
    }
    else if (GENERAL.sdk === 'crazyGames' && this.sdk.crazyGames) {
      return this.sdk.crazyGames.user.systemInfo.locale
    } else {
      return null
    }
  }

  public readonly gameplay = {
    start: () => {
      if (GENERAL.sdk === 'yandexGames' && this.sdk.yandexGames) {
        this.sdk.yandexGames.features.GameplayAPI.start()
      }
      if (GENERAL.sdk === 'crazyGames' && this.sdk.crazyGames) {
        this.sdk.crazyGames.game.gameplayStart()
      }
    },
    stop: () => {
      if (GENERAL.sdk === 'yandexGames' && this.sdk.yandexGames) {
        this.sdk.yandexGames.features.GameplayAPI.stop()
      }
      if (GENERAL.sdk === 'crazyGames' && this.sdk.crazyGames) {
        this.sdk.crazyGames.game.gameplayStop()
      }
    }
  }

  public readonly clipboard = {
    writeText: (text: string) => {
      if (GENERAL.sdk === 'yandexGames' && this.sdk.yandexGames) {
        this.sdk.yandexGames.clipboard.writeText(text)
      } else {
        navigator.clipboard.writeText(text).catch(e => console.log(e.message))
      }
    }
  }

  public init = () => {
    if (!GENERAL.sdk) return
    const s = document.createElement('script')
    s.src = SDK_SRC[GENERAL.sdk]
    s.async = true
    if (GENERAL.sdk === 'yandexGames') {
      s.onload = () => {
        // console.log('YandexGames SDK loaded.')
        if (typeof YaGames === 'undefined') {
          this.ready.status = false
          this.ready.error = 'api initialization error'
          return
        }
        YaGames.init().then(sdk => {
          // console.log('YandexGames SDK initialized.')
          this.sdk.yandexGames = sdk
          this.emit()
        })
      }
    }
    if (GENERAL.sdk === 'crazyGames') {
      s.onload = () => {
        // console.log('CrazyGames SDK loaded.')
        CrazyGames.SDK.init().then(() => {
          // console.log('CrazyGames SDK initialized.')
          this.sdk.crazyGames = CrazyGames.SDK
          this.emit()
        })
      }
    }
    s.onerror = () => {
      this.ready.status = false
      this.ready.error = 'api loading error'
    }
    document.body.append(s)
  }

  public initSync = () => {
    this.registerCallback(() => { this.ready.status = true })
    this.init()

    return new Promise<void>((resolve, reject) => {
      let repeats = 10 // 500ms to each
      const readyCheck = () => {
        if (this.ready.status === true) {
          return resolve()
        } else {
          if (this.ready.error) {
            return reject(this.ready.error)
          }

          repeats -= 1
          if (repeats > 0) {
            setTimeout(readyCheck, 500)
          } else {
            return reject('api initialization timeout')
          }
        }
      }
      setTimeout(readyCheck, 100)
    })
  }

  public registerCallback = (callback: () => void) => {
    if (!GENERAL.sdk) {
      callback()
    }
    else if (GENERAL.sdk === 'yandexGames' && this.sdk.yandexGames) {
      callback()
    } else {
      this.callbacks.push(callback)
    }
  }

  private emit = () => {
    let callback = this.callbacks.pop()
    while (callback) {
      callback()
      callback = this.callbacks.pop()
    }
  }
}
