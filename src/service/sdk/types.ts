export type TSDK = 'yandexGames' | 'crazyGames'

export interface GetLeaderboardEntriesOpts {
  includeUser?: boolean
  quantityAround?: number
  quantityTop?: number
}

export interface LeaderboardEntriesData {
  entries: LeaderboardEntry[]
}

export interface LeaderboardEntry {
  extraData?: string
  formattedScore: string
  player: {
    lang: string
    publicName: string
    scopePermissions: {
      avatar: string
      public_name: string
    }
    uniqueID: string
    getAvatarSrc(size: "large" | "medium" | "small"): string
    getAvatarSrcSet(size: "large" | "medium" | "small"): string
  }
  rank: number
  score: number
}
