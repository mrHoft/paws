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
    // tooltip
    newGame: 'Hold space/tap to jump',
    firstAnimal: 'Need to jump on target',
    firstBarrier: 'Need to jump over the target',
    firstTimeout: 'The animal can run away',
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
    // tooltip
    newGame: 'Удерживайте пробел/тап для прыжка',
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
    // tooltip
    newGame: 'Zıplamak için boşluk tuşunu basılı tutun/dokunun',
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
    // tooltip
    newGame: 'Leertaste gedrückt halten/tippen zum Springen',
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
    // tooltip
    newGame: 'Maintenez espace/touchez pour sauter',
    firstAnimal: 'Doit sauter sur la cible',
    firstBarrier: 'Doit sauter par-dessus la cible',
    firstTimeout: 'L\'animal peut s\'échapper',
  }
}
