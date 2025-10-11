export const CANVAS = {
  width: 1280,
  height: 576,
  get aspectRatio(): number {
    return this.height / this.width
  },
}

export const SpriteSize = {
  cat: {
    width: 252,
    height: 144,
    get aspectRatio(): number {
      return this.height / this.width
    },
  },
}

// Core game constants
export const GAME = {
  version: 'alpha.0.2.11',
  scorePerLevel: 1000,
  catchRange: 24, // A range where an animal can be caught
  meter: true, // Performance meter
  actionPositionVertical: Math.floor(CANVAS.height * 0.88),
  shadowsEnable: false,
  trajectoryStep: 3,
  jumpHeightMin: Math.floor(SpriteSize.cat.height / 1.5),
  jumpHeightMax: SpriteSize.cat.height * 2.25,
  defaultCatX: Math.floor(CANVAS.width / 3),
  get defaultCatY(): number {
    return this.actionPositionVertical + SpriteSize.cat.height * .05
  },
  defaultTargetX: CANVAS.width / 2,
  animalPositionDelta: CANVAS.width / 8,
  get defaultTargetY(): number {
    return this.actionPositionVertical
  },
  defaultTargetHeight: 128,
  defaultRunAwayDelay: 8000, // The time after which the target will escape
}

export type TAnimalName = 'butterfly' | 'grasshopper' | 'frog' | 'bird' | 'mouse'
export type TTargetName = TAnimalName | 'cactus1' | 'cactus2' | 'puddle' | 'boulder' | 'flowerpot' | 'gnome' | 'bucket' | 'none'
export const ANIMAL_LIST: TTargetName[] = ['mouse', 'grasshopper', 'butterfly', 'bird']
export const BARRIER_LIST: TTargetName[] = ['cactus1', 'cactus2', 'puddle', 'boulder', 'flowerpot', 'gnome', 'bucket']

export type TLevelName = 'autumn' | 'cliff' | 'desert' | 'forest' | 'jungle' | 'lake' | 'mountains' | 'default'
export const LEVEL_NAMES: TLevelName[] = ['autumn', 'cliff', 'desert', 'forest', 'jungle', 'lake', 'mountains']

export const TARGETS_PER_LEVEL: Record<TLevelName, TTargetName[]> = {
  autumn: ['mouse', 'bird', 'puddle', 'flowerpot', 'boulder'],
  cliff: ['butterfly', 'grasshopper', 'flowerpot', 'boulder', 'gnome'],
  desert: ['butterfly', 'mouse', 'cactus1', 'cactus2',],
  forest: ['butterfly', 'grasshopper', 'bird', 'puddle', 'boulder'],
  jungle: ['butterfly', 'grasshopper', 'bird', 'puddle', 'boulder', 'cactus1'],
  lake: ['mouse', 'bird', 'puddle', 'flowerpot', 'gnome'],
  mountains: ['mouse', 'grasshopper', 'puddle', 'flowerpot', 'gnome'],
  default: [...ANIMAL_LIST, ...BARRIER_LIST], // Testing level
}

export const TARGET_SCORE: Record<TTargetName, Record<'success' | 'fail', number>> = {
  none: { success: 0, fail: 0 },

  butterfly: { success: 10, fail: 0 },
  grasshopper: { success: 10, fail: 0 },
  frog: { success: 10, fail: -5 },
  bird: { success: 10, fail: -5 },
  mouse: { success: 10, fail: -10 },

  puddle: { success: 5, fail: -5 },
  boulder: { success: 5, fail: -5 },
  flowerpot: { success: 10, fail: -10 },
  bucket: { success: 5, fail: -10 },
  gnome: { success: 5, fail: -10 },
  cactus1: { success: 5, fail: -20 },
  cactus2: { success: 5, fail: -20 },
}

type Tooltip = 'newGame' | 'firstAnimal' | 'firstBarrier' | 'firstTimeout'
export const TOOLTIP: Record<Tooltip, string> = {
  newGame: 'Hold space/tap to jump',
  firstAnimal: 'Need to jump on target',
  firstBarrier: 'Need to jump over the target',
  firstTimeout: 'The animal can run away',
}
