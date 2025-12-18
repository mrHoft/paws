import { iconSrc } from "~/ui/icons"

export const GENERAL = {
  sdk: 'yandex-games',  // | null
  canvas: {
    width: 1280,
    height: 720,
    get aspectRatio(): number {
      return Math.round(this.width / this.height * 100) / 100
    },
  },
  thumb: {
    width: 400,
    height: 300
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
  version: 'v.0.5.19',
  catchRange: 24, // A range where an animal can be caught
  shadowsEnable: false,

  updateTime: Math.floor(1000 / 60 * 100) / 100, // The time between renders (60fps)
  movementSpeed: 10,
  trajectoryStep: 4,

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
  insect: number
  frog: number
  bird: number
  mouse: number
  stars: number
}

export const caughtDefault: TCaught = {
  insect: 0,
  frog: 0,
  bird: 0,
  mouse: 0,
  stars: 0
}


type TUpgradeCost = Record<string, number>
export const UPGRADES: Record<string, { icon: string, grades: number, cost: TUpgradeCost }> = {
  jump: { icon: iconSrc.jump, grades: 5, cost: { insect: 10, frog: 10, stars: 10 } },
  precise: { icon: iconSrc.eye, grades: 5, cost: { insect: 10, mouse: 10, stars: 10 } },
  claws: { icon: iconSrc.claws, grades: 5, cost: { bird: 10, mouse: 10, stars: 10 } },
  speed: { icon: iconSrc.speed, grades: 5, cost: { bird: 10, insect: 10, stars: 10 } },
  // cat: { icon: iconSrc.cat, grades: 1, cost: { mouse: 50, frog: 50, stars: 100 } }
}

export const ACHIEVEMENTS: Record<string, { icon: string, num?: number, hidden?: true }> = {
  'catch1': { icon: 'paw', num: 1 }, // Novice trapper (catch 50 animals)
  'catch2': { icon: 'paw', num: 2 }, // Seasoned hunter (catch 250 animals)
  'catch3': { icon: 'paw', num: 3 }, // Master of the wild (catch 1000 animals)
  'perfect': { icon: 'stars-stack' }, // Flawless stage (complete a stage with 3 stars)
  'stages1': { icon: 'steel-wing', num: 1 },  // First steps (complete all stages)
  'stages2': { icon: 'steel-wing', num: 2 },  // Perfectionist (complete all stages with 3 stars)
  'stars1': { icon: 'star-swirl', num: 1 },  // Star Gatherer (collect 100 stars)
  'stars2': { icon: 'star-swirl', num: 2 },  // Star Collector (collect 500 stars)
  'stars3': { icon: 'star-swirl', num: 3 },  // Stellar Hoarder (collect 1000 stars)
  'pegasus': { icon: 'pegasus' },  // Momentum Leaper (perform a jump from a run)
  'upgrade1': { icon: 'upgrade', num: 1 },  // Enhanced (make your first upgrade)
  'upgrade2': { icon: 'upgrade', num: 2 },  // Peak performance (make all upgrades)
  'upgrade3': { icon: 'lion' },  // Maxed out! (make upgrade to the max tier)
  'dog': { icon: 'dog', hidden: true },  // Met the dog
  'birds': { icon: 'bird' },  // Ornithologist (catch all types of birds)
  'insects': { icon: 'insect' },  // Entomologist (catch all types of insects)
  'zoo': { icon: 'mouse-seated' },  // Zoologist (catch all animal types)
  'streak': { icon: 'doubled' },  // Perfect Streak (catch 10 animals in a row)
  'cactus': { icon: 'cactus', hidden: true },  // Needle in a paw (catch a cactus)
  'hidden': { icon: 'cat', hidden: true }
}
