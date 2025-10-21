export const CANVAS = {
  width: 1280,
  height: 720,
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
  version: 'alpha.0.2.12',
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

export type TAnimalName = 'butterfly1' | 'butterfly2' | 'grasshopper' | 'frog' | 'bird' | 'mouse'
export type TTargetName = TAnimalName | 'cactus1' | 'cactus2' | 'puddle' | 'boulder' | 'flowerpot' | 'gnome' | 'bucket' | 'hedgehog' | 'dog' | 'none'
export const ANIMALS: TAnimalName[] = ['mouse', 'grasshopper', 'butterfly1', 'butterfly2', 'bird']
export const OBSTACLES: TTargetName[] = ['cactus1', 'cactus2', 'puddle', 'boulder', 'flowerpot', 'gnome', 'bucket', 'hedgehog', 'dog']

export type TSceneName = 'autumn' | 'cliff' | 'desert' | 'forest' | 'jungle' | 'lake' | 'mountains' | 'default'
export const SCENE_NAMES: TSceneName[] = ['autumn', 'cliff', 'desert', 'forest', 'jungle', 'lake', 'mountains']

export const SCENE_TARGETS: Record<TSceneName, TTargetName[]> = {
  autumn: ['dog', 'hedgehog'],
  // autumn: ['mouse', 'bird', 'puddle', 'flowerpot', 'boulder', 'dog'],
  cliff: ['butterfly1', 'grasshopper', 'flowerpot', 'boulder', 'gnome', 'hedgehog'],
  desert: ['butterfly1', 'mouse', 'cactus1', 'cactus2',],
  forest: ['butterfly1', 'butterfly2', 'grasshopper', 'bird', 'puddle', 'boulder', 'hedgehog'],
  jungle: ['butterfly2', 'grasshopper', 'bird', 'puddle', 'boulder', 'cactus1', 'hedgehog'],
  lake: ['mouse', 'bird', 'puddle', 'flowerpot', 'gnome', 'dog'],
  mountains: ['mouse', 'grasshopper', 'puddle', 'flowerpot', 'gnome'],
  default: [...ANIMALS, ...OBSTACLES], // Testing level
}

export const TARGET_SCORE: Record<TTargetName, Record<'success' | 'fail', number>> = {
  none: { success: 0, fail: 0 },

  butterfly1: { success: 10, fail: 0 },
  butterfly2: { success: 10, fail: 0 },
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
  hedgehog: { success: 10, fail: -20 },
  dog: { success: 10, fail: -20 },
}
