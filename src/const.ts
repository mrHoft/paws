export const CANVAS = {
  width: 800,
  height: 360,
  get aspectRatio(): number {
    return this.height / this.width
  },
}

export const SpriteSize = {
  cat: {
    width: 100,
    height: 74,
    get aspectRatio(): number {
      return this.height / this.width
    },
  },
}

// Core game constants
export const GAME = {
  version: 'alpha.0.2.10',
  scorePerLevel: 1000,
  catchRange: 10, // A range where an animal can be caught
  meter: true, // Performance meter
  actionPositionVertical: Math.floor(CANVAS.height * 0.88),
  shadowsEnable: false,
  trajectoryStep: 2,
  jumpHeightMin: Math.floor(SpriteSize.cat.height / 1.5),
  jumpHeightMax: SpriteSize.cat.height * 3,
  defaultCatX: Math.floor(CANVAS.width / 3),
  get defaultCatY(): number {
    return this.actionPositionVertical
  },
  defaultTargetX: CANVAS.width / 2,
  animalPositionDelta: CANVAS.width / 8,
  get defaultTargetY(): number {
    return this.actionPositionVertical
  },
  defaultTargetHeight: 80,
  stepTargetHeight: 10,
  defaultRunAwayDelay: 8000, // The time after which the target will escape
  stepTargetDelay: 1000
}

export type TAnimalName = 'butterfly' | 'grasshopper' | 'frog' | 'bird' | 'mouse'

export type TTargetName = TAnimalName | 'cactus' | 'puddle' | 'boulder' | 'flowerpot' | 'flowerpotEmpty' | 'gnome' | 'bucket' | 'none'

export const ANIMAL_LIST: TTargetName[] = ['mouse', 'grasshopper', 'butterfly', 'bird']

export const BARRIER_LIST: TTargetName[] = ['cactus', 'puddle', 'boulder', 'flowerpot', 'flowerpotEmpty', 'gnome', 'bucket']

export const DIFFICULTY_PER_LEVEL: TTargetName[][] = [
  ['mouse', 'grasshopper', 'butterfly', 'bird', 'cactus', 'puddle', 'boulder', 'flowerpot', 'gnome', 'bucket'], // Testing level 0
  ['butterfly', 'puddle', 'flowerpot'],
  ['butterfly', 'grasshopper', 'puddle', 'flowerpot'],
  ['butterfly', 'grasshopper', 'puddle', 'flowerpot', 'gnome'],
  ['grasshopper', 'mouse', 'puddle', 'flowerpot', 'gnome'],
  ['grasshopper', 'mouse', 'bird', 'gnome', 'cactus'],
]

export const TARGET_SCORE: Record<TTargetName, Record<'success' | 'fail', number>> = {
  none: { success: 0, fail: 0 },

  butterfly: { success: 10, fail: 0 },
  grasshopper: { success: 10, fail: 0 },
  frog: { success: 10, fail: -5 },
  bird: { success: 10, fail: -5 },
  mouse: { success: 10, fail: -10 },

  puddle: { success: 5, fail: -5 },
  boulder: { success: 5, fail: -5 },
  flowerpotEmpty: { success: 5, fail: -5 },
  flowerpot: { success: 10, fail: -10 },
  bucket: { success: 5, fail: -10 },
  gnome: { success: 5, fail: -10 },
  cactus: { success: 5, fail: -20 },
}

type Tooltip = 'newGame' | 'firstAnimal' | 'firstBarrier' | 'firstTimeout'
export const TOOLTIP: Record<Tooltip, string> = {
  newGame: 'Hold space/tap to jump',
  firstAnimal: 'Need to jump on target',
  firstBarrier: 'Need to jump over the target',
  firstTimeout: 'The animal can run away',
}

export const LEVEL_NAMES = ['autumn', 'cliff', 'desert', 'forest', 'jungle', 'lake', 'mountains']
