export const GENERAL = {
  outerLinks: true,
  fullscreenControl: true,
  sdk: null, //'ya-games' | null
  canvas: {
    width: 1280,
    height: 720,
    get aspectRatio(): number {
      return Math.round(this.width / this.height * 100) / 100
    },
  }
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
  version: 'beta.0.5.16',
  catchRange: 24, // A range where an animal can be caught
  shadowsEnable: false,

  updateTime: Math.floor(1000 / 60 * 1000) / 1000, // The time between renders (60fps)
  updateModifier: 2,  // Affects updateTime (2 = 120fps)
  movementSpeed: 4,
  trajectoryStep: 1.5,

  actionPositionVertical: Math.floor(GENERAL.canvas.height * 0.88),
  jumpHeightMin: Math.floor(SpriteSize.cat.height / 1.5),
  jumpHeightMax: SpriteSize.cat.height * 2.25,
  defaultCatX: Math.floor(GENERAL.canvas.width / 3),
  get defaultCatY(): number {
    return this.actionPositionVertical + SpriteSize.cat.height * .05
  },
  defaultTargetX: GENERAL.canvas.width / 2,
  animalPositionDelta: GENERAL.canvas.width / 8,
  get defaultTargetY(): number {
    return this.actionPositionVertical
  },
  defaultObstacleHeight: 128,
  defaultAnimalHeight: 160,
  defaultRunAwayDelay: 8000, // The time after which the target will escape

  roundLength: 30,
}

export type TAnimalName = 'butterfly1' | 'butterfly2' | 'grasshopper' | 'frog' | 'bird1' | 'bird2' | 'mouse'
export type TTargetName = TAnimalName | 'cactus1' | 'cactus2' | 'puddle' | 'boulder' | 'flowerpot' | 'gnome' | 'bucket' | 'hedgehog' | 'dog' | 'bucket' | 'none'
export const ANIMALS: TAnimalName[] = ['mouse', 'grasshopper', 'butterfly1', 'butterfly2', 'bird1', 'bird2', 'frog']
export const OBSTACLES: TTargetName[] = ['cactus1', 'cactus2', 'puddle', 'boulder', 'flowerpot', 'gnome', 'bucket', 'hedgehog', 'dog', 'bucket']

export type TSceneName = 'autumn' | 'cliff' | 'desert' | 'forest' | 'jungle' | 'lake' | 'mountains' | 'default'
export const SCENE_NAMES: TSceneName[] = ['autumn', 'cliff', 'desert', 'forest', 'jungle', 'lake', 'mountains']

export const SCENE_TARGETS: Record<TSceneName, TTargetName[]> = {
  autumn: ['mouse', 'bird1', 'frog', 'puddle', 'flowerpot', 'boulder', 'dog', 'bucket'],
  cliff: ['butterfly1', 'grasshopper', 'bird1', 'flowerpot', 'boulder', 'hedgehog'],
  desert: ['butterfly1', 'mouse', 'cactus1', 'cactus2', 'boulder'],
  forest: ['butterfly1', 'butterfly2', 'grasshopper', 'bird1', 'puddle', 'boulder', 'hedgehog'],
  jungle: ['butterfly2', 'frog', 'bird2', 'puddle', 'boulder', 'cactus1', 'hedgehog'],
  lake: ['mouse', 'bird2', 'frog', 'puddle', 'flowerpot', 'gnome', 'dog'],
  mountains: ['mouse', 'grasshopper', 'puddle', 'flowerpot', 'gnome'],
  default: [...ANIMALS, ...OBSTACLES], // Testing level
}

export const TARGET_SCORE: Record<TTargetName, Record<'success' | 'fail', number>> = {
  none: { success: 0, fail: 0 },

  butterfly1: { success: 10, fail: 0 },
  butterfly2: { success: 10, fail: 0 },
  grasshopper: { success: 10, fail: 0 },
  frog: { success: 10, fail: -5 },
  bird1: { success: 10, fail: -5 },
  bird2: { success: 10, fail: -5 },
  mouse: { success: 10, fail: -10 },

  puddle: { success: 5, fail: -5 },
  boulder: { success: 5, fail: -5 },
  flowerpot: { success: 10, fail: -10 },
  bucket: { success: 5, fail: -10 },
  gnome: { success: 5, fail: -10 },
  cactus1: { success: 5, fail: -20 },
  cactus2: { success: 5, fail: -20 },
  hedgehog: { success: 10, fail: -20 },
  dog: { success: 10, fail: -20 },
}

export type TCaught = {
  butterfly: number
  frog: number
  bird: number
  mouse: number
}

export const caughtDefault: TCaught = {
  butterfly: 0,
  frog: 0,
  bird: 0,
  mouse: 0,
}
