import { Storage } from "./storage"
import { YandexGamesService } from "./sdk.yandex/sdk"
import { inject, Injectable } from "~/utils/inject"
import { iconSrc } from "~/ui/icons"

export interface LeaderboardEntry { rank: number, name: string, score: number, avatar: string }

@Injectable
export class LeaderboardService {
  private storage: Storage
  private yandexGames: YandexGamesService
  public leaderboard: LeaderboardEntry[] = []

  constructor() {
    this.storage = inject(Storage)
    this.yandexGames = inject(YandexGamesService)
  }

  public update = (): Promise<LeaderboardEntry[]> => {
    if (this.yandexGames.sdk) {
      return this.yandexGames.sdk.leaderboards.getEntries('leaderboard', { includeUser: true, quantityAround: 4, quantityTop: 5 }).then(data => {
        if (data && data.entries && data.entries.length > 0) {
          this.leaderboard = data.entries.map(entry => ({
            rank: entry.rank,
            name: entry.player.publicName,
            score: entry.score,
            avatar: entry.player.getAvatarSrc('small')
          }))
        }
        return this.leaderboard
      })
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
