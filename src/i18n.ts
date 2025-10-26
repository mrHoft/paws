export type TLanguage = 'en' | 'ru' | 'tr' | 'de' | 'fr'
export const LANGUAGES: TLanguage[] = ['en', 'ru', 'tr', 'de', 'fr']

export const i18n: Record<TLanguage, Record<string, string>> = {
  en: {
    // ui
    start: 'Start',
    restart: 'Restart',
    pause: 'Pause',
    settings: 'Settings',
    about: 'About',
    level: 'Level',
    score: 'Score',
    combo: 'Combo',
    confirmation: 'Confirmation',
    confirmationDefault: 'Are you sure?',
    restartDesc: 'This will reset all your progress. Are you sure want to restart?',
    // tooltip
    startNewGame: 'Hold space/tap to jump',
    firstAnimal: 'Need to jump on target',
    firstBarrier: 'Need to jump over the target',
    firstTimeout: 'The animal can run away',

    continue: 'Continue',
    twoPlayers: '2 Players',
    connectGamepad: 'Please connect your gamepads and press any buttons to start',
    go: 'GO!',
    win: 'Win',
    replay: 'Are you ready to replay?',
    finish: 'Finish!',
    winText: 'cat win!',
    time: 'Time',
    upper: 'Upper',
    bottom: 'Bottom'
  },
  ru: {
    // ui
    start: 'Старт',
    restart: 'Заново',
    pause: 'Пауза',
    settings: 'Настройки',
    about: 'О программе',
    level: 'Уровень',
    score: 'Счёт',
    combo: 'Комбо',
    confirmation: 'Подтверждение',
    confirmationDefault: 'Вы уверены?',
    restartDesc: 'Это сбросит весь ваш прогресс. Вы точно хотите начать заново?',
    // tooltip
    startNewGame: 'Удерживайте пробел/тап для прыжка',
    firstAnimal: 'Для поимки нужно прыгать на цель',
    firstBarrier: 'Через препятствие нужно перепрыгивать',
    firstTimeout: 'Животное может убежать',
  },
  tr: {
    // ui
    start: 'Başlat',
    restart: 'Yeniden Başlat',
    pause: 'Duraklat',
    settings: 'Ayarlar',
    about: 'Hakkında',
    level: 'Seviye',
    score: 'Skor',
    combo: 'Kombo',
    confirmation: 'Onay',
    confirmationDefault: 'Emin misiniz?',
    restartDesc: 'Bu, tüm ilerlemenizi sıfırlayacak. Yeniden başlatmak istediğinizden emin misiniz?',
    // tooltip
    startNewGame: 'Zıplamak için boşluk tuşunu basılı tutun/dokunun',
    firstAnimal: 'Hedefin üzerine zıplanmalı',
    firstBarrier: 'Hedefin üzerinden atlanmalı',
    firstTimeout: 'Hayvan kaçabilir',
  },
  de: {
    // ui
    start: 'Start',
    restart: 'Neustart',
    pause: 'Pause',
    settings: 'Einstellungen',
    about: 'Über',
    level: 'Level',
    score: 'Punkte',
    combo: 'Combo',
    confirmation: 'Bestätigung',
    confirmationDefault: 'Sind Sie sicher?',
    restartDesc: 'Dies wird Ihren gesamten Fortschritt zurücksetzen. Möchten Sie wirklich neu starten?',
    // tooltip
    startNewGame: 'Leertaste gedrückt halten/tippen zum Springen',
    firstAnimal: 'Muss auf das Ziel springen',
    firstBarrier: 'Muss über das Ziel springen',
    firstTimeout: 'Das Tier kann weglaufen',
  },
  fr: {
    // ui
    start: 'Commencer',
    restart: 'Recommencer',
    pause: 'Pause',
    settings: 'Paramètres',
    about: 'À propos',
    level: 'Niveau',
    score: 'Score',
    combo: 'Combo',
    confirmation: 'Confirmation',
    confirmationDefault: 'Êtes-vous sûr?',
    restartDesc: 'Cela réinitialisera toute votre progression. Êtes-vous sûr de vouloir recommencer?',
    // tooltip
    startNewGame: 'Maintenez espace/touchez pour sauter',
    firstAnimal: 'Doit sauter sur la cible',
    firstBarrier: 'Doit sauter par-dessus la cible',
    firstTimeout: 'L\'animal peut s\'échapper',
  }
}
