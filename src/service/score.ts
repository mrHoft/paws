import { Storage } from "./storage"
import { SDKService } from "./sdk/sdk"
import { LeaderboardService } from "~/service/leaderboard"
import { inject } from "~/utils/inject"

export class ScoreService {
  private storage: Storage
  private sdkService: SDKService
  private leaderboardService: LeaderboardService

  constructor() {
    this.storage = inject(Storage)
    this.sdkService = inject(SDKService)
    this.leaderboardService = inject(LeaderboardService)
  }

  public set value(value: number) {
    const cur = this.storage.get<number>('data.score') || 0
    if (value > cur) {
      this.storage.set('data.score', value)
    }
  }

  public update = async () => {
    const sceneData = this.storage.get<Record<string, { stars: number, score: number }>>('data.scene')
    const totalScore = Object.values(sceneData).reduce((acc, cur) => acc + cur.score, 0)
    this.storage.set('data.score', totalScore)

    await this.sdkService.leaderboards.setScore('leaderboard', totalScore)
    this.leaderboardService.update()
  }
}
