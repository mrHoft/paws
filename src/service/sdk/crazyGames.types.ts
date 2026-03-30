declare global {
  const CrazyGames: {
    SDK: CrazyGamesSDK
  }
}

export interface CrazyGamesSDK {
  init(): Promise<void>
  user: {
    isUserAccountAvailable: boolean
    getUser(): Promise<User>
    systemInfo: SystemInfo
    listFriends(props: { page: number, size: number }): Promise<Friends>
    getUserToken(): Promise<UserToken>
    showAuthPrompt(): Promise<void>
    addAuthListener(listener: (user: User) => void): void
    showAccountLinkPrompt: Promise<{ response: 'yes' | 'no' }>
  }
  environment(): Promise<void>
  game: {
    loadingStart(): void
    loadingStop(): void
    gameplayStart(): void
    gameplayStop(): void
    settings: GameSettings
    addSettingsChangeListener(listener: (newSettings: GameSettings) => void): void
    removeSettingsChangeListener(listener: (newSettings: GameSettings) => void): void
  },
  data: {
    clear(): void;
    getItem(key: string): string | null
    removeItem(key: string): void
    setItem(key: string, value: string): void
  }
}

interface GameSettings {
  disableChat: boolean
  muteAudio: boolean
}

interface User {
  username: string,
  profilePictureUrl: string
}

interface UserToken extends User {
  userId: string,
  gameId: string,
  iat: number,
  exp: number
}

interface SystemInfo {
  countryCode: string,
  locale: string,
  device: {
    type: 'desktop' | 'tablet' | 'mobile'
  },
  os: {
    name: string,
    version: string
  },
  browser: {
    name: string,
    version: string
  },
  applicationType: 'google_play_store' | 'apple_store' | 'pwa' | 'web'
}

interface Friends {
  friends: {
    id: string
    username: string
    profilePictureUrl: string
  }[]
  page: number
  size: number
  hasMore: boolean
  total: number
}
