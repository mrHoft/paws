import { Storage } from "./storage"
import { SDKService } from "./sdk/sdk"
import { inject, Injectable } from "~/utils/inject"
import { iconSrc } from "~/ui/icons"
import { GENERAL } from "~/const"

export interface LeaderboardEntry { rank: number, name: string, score: number, avatar: string }

@Injectable
export class LeaderboardService {
  private storage: Storage
  private sdkService: SDKService
  public leaderboard: LeaderboardEntry[] = []

  constructor() {
    this.storage = inject(Storage)
    this.sdkService = inject(SDKService)
  }

  private timeoutPromise = <T>(promise: Promise<T>, timeoutMs = 2500, message = 'Operation timed out') => {
    let timeoutId: ReturnType<typeof setTimeout>

    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutId = setTimeout(() => {
        const messageText = `${message} (${timeoutMs}ms)`
        console.warn(messageText)
        reject(new Error(messageText))
      }, timeoutMs)
    })

    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId))
  }

  public update = (): Promise<LeaderboardEntry[]> => {
    if (GENERAL.sdk === 'yandexGames') {
      return this.timeoutPromise(
        this.sdkService.leaderboards.getEntries('leaderboard', { includeUser: true, quantityAround: 9, quantityTop: 5 }).then(data => {
          if (data && data.entries && data.entries.length > 0) {
            this.leaderboard = data.entries.map(entry => ({
              rank: entry.rank,
              name: entry.player.publicName,
              score: entry.score,
              avatar: entry.player.getAvatarSrc('small')
            }))
          }
          return this.leaderboard
        }),
        2500,
        'Leaderboard request timeout'
      )
    }

    this.leaderboard = [{
      rank: 1,
      name: 'You',
      score: this.storage.get<number>('data.score'),
      avatar: iconSrc.cat
    }]

    return Promise.resolve(this.leaderboard)
  }

  public get = (): Promise<LeaderboardEntry[]> => {
    if (this.leaderboard.length > 0) return Promise.resolve(this.leaderboard)
    return this.update()
  }
}
