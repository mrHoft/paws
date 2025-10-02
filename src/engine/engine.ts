import {
  ANIMAL_LIST, BARRIER_LIST, CANVAS, DIFFICULTY_PER_LEVEL, GAME, TARGET_SCORE, type TAnimalName
} from '../const'
import Draw from './draw'
import Resource, { type TGifObject } from './resource'
import { BgMotion } from './bgMotion'
import FlyingValues from './flyingValues'
import Queue from '../utils/queue'
import Events from './events'
import Tooltip from './tooltip'
import type { Target, TCat, TCatched, TGame } from './types'

export class Engine {
  private game: TGame = {
    SPEED: 0.5, // Game complexity refers to current level (Slow: 0.5 Max: 1)
    successHeightModifier: 1.3, // Defines jump to target height ratio
    // Frame reit, actually no :). Updates automatically.
    get updateTime(): number {
      return Math.floor(17 / this.SPEED)
    },
    action: null,
    ctx: null,
    definingTrajectory: false, // Jump attempt state
    timer: 0, // setTimeout link
    movementSpeed: 6,
    runAwaySpeed: 6,
    successHeight: GAME.defaultTargetHeight,
    success: false,
    fullJump: true, // To know does current target need a full jump
    paused: false,
    combo: 0, // Combo multiplier for score
    score: GAME.initialScore,
    catched: {
      butterfly: 0,
      grasshopper: 0,
      frog: 0,
      bird: 0,
      mouse: 0,
    },
  }
  private cat: TCat = {
    source: {} as TGifObject,
    jumpHeight: GAME.jumpHeightMin,
    jumpStage: 0,
    trajectoryDirection: 1,
    CatX: GAME.defaultCatX,
    CatY: GAME.defaultCatY,
    atPosition: false,
  }
  private target: Target = {
    nameCurr: 'none',
    nameLast: 'none',
    xCurr: this.cat.CatX + CANVAS.width / 2,
    yCurr: GAME.defaultTargetY,
    xLast: GAME.defaultTargetX,
    yLast: GAME.defaultTargetY,
    PositionX: GAME.defaultTargetX, // A place where a target will stop
    heightCurr: GAME.defaultTargetHeight,
    heightLast: GAME.defaultTargetHeight,
    isBarrier: false,
    runAwayDelay: GAME.defaultRunAwayDelay,
    atPosition: false,
  }
  private resource: Resource
  private draw: Draw
  private fly: FlyingValues
  private Events: Events
  private Tooltip: Tooltip
  private bgMotion: BgMotion
  private meterStack = new Queue()
  private setPauseVisible: (pause: boolean) => void
  private handleGameOver: () => void
  private showLevel: (value: number) => void
  private showCombo: (value: number) => void
  private setTooltip: (tooltip: string) => void
  private updateScore: (score: number) => void
  private updateCatched: (id: keyof TCatched) => void
  private static __instance: Engine

  private constructor(ctx: CanvasRenderingContext2D, handlers: Record<string, (value?: any) => void>) {
    this.setPauseVisible = handlers.setPauseVisible
    this.handleGameOver = handlers.handleGameOver
    this.showLevel = handlers.setLevel
    this.showCombo = handlers.setCombo
    this.setTooltip = handlers.setTooltip
    this.updateScore = handlers.updateScore
    this.updateCatched = handlers.updateCatched

    this.game.ctx = ctx
    this.game.successHeight = GAME.defaultTargetHeight * this.game.successHeightModifier
    this.draw = new Draw(this.game.ctx!)
    this.fly = new FlyingValues(this.game.ctx!)
    this.bgMotion = new BgMotion({})
    this.Events = new Events(this.game, this.prepareJumpStart, this.prepareJumpEnd, this.pause)
    this.Tooltip = new Tooltip(this.setTooltip)

    this.resource = Resource.get()
    this.cat.source = this.resource.sprite.cat as TGifObject
  }

  private setScore = (value: number, multiplier = 1) => {
    const combo = Math.max(this.game.combo, 1)
    this.game.score += value * multiplier * combo
    this.updateScore(this.game.score)
    if (value != 0) this.fly.throw(value * combo, multiplier, this.cat.CatX)
    if (this.game.success) this.Tooltip.hide()
  }

  private commitFail = (reason?: 'timeout') => {
    if (this.game.score + TARGET_SCORE[this.target.nameCurr].fail < 0) {
      this.game.score = GAME.initialScore
      this.game.paused = true
      this.game.action = null
      this.handleGameOver()
      return
    }
    this.Tooltip.show(reason || (this.target.isBarrier ? 'barrier' : 'animal'))

    this.game.combo = 0
    this.showCombo(this.game.combo)
    this.game.success = false
    if (reason != 'timeout') {
      this.game.action = 'return'
    }
    this.setScore(TARGET_SCORE[this.target.nameCurr].fail)
    if (!this.target.isBarrier) this.levelPrepare()
  }

  private commitSuccess = () => {
    const multiplier = this.target.atPosition ? 1 : 2
    this.setScore(TARGET_SCORE[this.target.nameCurr].success, multiplier)
    if (!this.target.isBarrier) {
      if (this.game.combo < 5) {
        this.game.combo += 1
        if (this.game.combo > 1) {
          this.showCombo(this.game.combo)
          this.fly.throw('Combo:', this.game.combo, this.cat.CatX)
        }
      }
      const name: TAnimalName = this.target.nameCurr as TAnimalName

      this.updateCatched(name)
      this.target.nameCurr = 'none'
    }
    this.levelPrepare()
  }

  private prepareJumpStart = () => {
    this.cat.jumpHeight = GAME.jumpHeightMin
    this.cat.trajectoryDirection = 1
    this.game.definingTrajectory = true
    if (!this.updateIsNeeded()) {
      requestAnimationFrame(this.update)
    }
  }

  private prepareJumpEnd = () => {
    this.game.definingTrajectory = false
    // Prevent accidentially tapping
    if (this.cat.jumpHeight > GAME.jumpHeightMin + GAME.trajectoryStep * 2) {
      this.game.action = 'jump'
      this.cat.atPosition = false
      this.cat.jumpStage = -Math.PI
      this.game.successHeight = this.target.isBarrier
        ? Math.floor(
          this.target.heightCurr * this.game.successHeightModifier + (this.target.xCurr - this.target.PositionX) / 2
        )
        : Math.floor((this.target.xCurr - this.cat.CatX) / 2)
      this.game.success =
        (this.target.isBarrier && this.cat.jumpHeight > this.game.successHeight) ||
        Math.abs(this.cat.jumpHeight - this.game.successHeight) < GAME.catchRange
      // console.log('Jump height: ', this.cat.jumpHeight, '/', this.game.successHeight, this.game.success)	// Do not remove!
    }
  }

  private defineTrajectory = () => {
    this.cat.jumpHeight += GAME.trajectoryStep * this.cat.trajectoryDirection
    if (this.cat.jumpHeight >= GAME.jumpHeightMax) this.cat.trajectoryDirection = -1
    if (this.cat.jumpHeight < GAME.jumpHeightMin) {
      // Stops jump request
      this.game.action = 'stay'
      this.game.definingTrajectory = false
      this.cat.jumpStage = -Math.PI
    }
    this.draw.drawTrajectory(this.cat.CatX, this.cat.CatY, this.cat.jumpHeight, !this.target.isBarrier)
  }

  private defineJump = () => {
    const modifier = this.target.isBarrier ? 1 : 0.5
    const r = this.cat.jumpHeight // Circle radius
    const points = r / 4 // Position count
    const step = Math.PI / points / modifier
    this.cat.jumpStage += step
    const i = this.cat.jumpStage
    if (!this.game.fullJump && !this.game.success && i > -Math.PI / 2) {
      this.commitFail()
    }
    if (i < 0) {
      this.cat.CatX = Math.floor(GAME.defaultCatX + r + r * Math.cos(i))
      const y = this.cat.CatY + r * Math.sin(i) * modifier
      const frameIndex = Math.floor(((i + Math.PI) / Math.PI) * 3)
      this.draw.drawCat(this.cat.source.frames[frameIndex].image, this.cat.CatX, y)
    } else {
      this.game.success ? this.commitSuccess() : this.commitFail()
    }
  }

  private sceneChange = () => {
    // Move last target
    if (this.target.nameLast != 'none') {
      this.runAway()

      this.draw.drawTarget(
        this.target.nameLast,
        this.target.xLast,
        this.target.yLast,
        this.target.heightLast,
        !this.game.success
      )
      if (this.target.xLast < 0 || this.target.xLast > CANVAS.width) this.target.nameLast = 'none'
    }

    // Move current target
    this.target.xCurr -= this.cat.atPosition ? this.game.movementSpeed : Math.floor((this.game.movementSpeed / 2) * 3)
    if (this.target.xCurr < this.target.PositionX) {
      this.target.xCurr = this.target.PositionX
      this.target.atPosition = true
      if (!this.target.isBarrier) {
        this.game.timer = window.setTimeout(() => this.commitFail('timeout'), this.target.runAwayDelay)
      }
    }

    // Move Cat
    if (this.cat.CatX > GAME.defaultCatX) {
      this.cat.CatX -= this.target.atPosition ? Math.floor((this.game.movementSpeed / 3) * 2) : this.game.movementSpeed
    } else {
      this.cat.atPosition = true
    }

    if (this.cat.atPosition && this.target.atPosition) {
      setTimeout(() => (this.game.action = 'stay'), 0)
    }
  }

  private runAway = () => {
    if (this.target.nameLast == 'butterfly' || this.target.nameLast == 'bird') {
      this.target.xLast -= this.game.runAwaySpeed
      this.target.yLast -= this.target.nameLast == 'butterfly' ? Math.random() * 6 : 4
      return
    }

    if (this.target.nameLast == 'grasshopper') {
      this.target.xLast -= this.game.runAwaySpeed
      return
    }

    if (this.target.nameLast == 'mouse') {
      this.target.xLast += this.game.runAwaySpeed
      return
    }

    this.target.xLast -= this.cat.atPosition ? this.game.movementSpeed : Math.floor((this.game.movementSpeed / 2) * 3)
    return
  }

  // Renders one frame
  private render = () => {
    // Development time patch
    if (!this.cat.source) this.cat.source = this.resource.sprite.cat as TGifObject
    performance.mark('beginRenderProcess')
    this.game.ctx!.clearRect(0, 0, CANVAS.width, CANVAS.height)
    if (!this.target.atPosition && (this.game.action == 'return' || this.game.action == 'scene')) {
      this.bgMotion.draw(this.cat.atPosition ? this.game.movementSpeed : Math.floor((this.game.movementSpeed / 2) * 3))
    }

    this.draw.drawTarget(this.target.nameCurr, this.target.xCurr, this.target.yCurr, this.target.heightCurr)

    if (this.game.definingTrajectory) this.defineTrajectory()

    switch (this.game.action) {
      case 'return':
        // this.sceneReturn()
        this.sceneChange()
        this.draw.drawCat(this.cat.source.image, this.cat.CatX, this.cat.CatY)
        break
      case 'scene':
        this.sceneChange()
        this.draw.drawCat(this.cat.source.image, this.cat.CatX, this.cat.CatY)
        break
      case 'run':
        this.draw.drawCat(this.cat.source.image, this.cat.CatX, this.cat.CatY)
        break
      case 'jump':
        this.defineJump()
        break
      default: //'stay'
        this.draw.drawCat(this.cat.source.frames[2].image, this.cat.CatX, this.cat.CatY)
    }
    this.fly.render()
    if (this.game.definingTrajectory || this.updateIsNeeded()) setTimeout(this.update, this.game.updateTime)
    // Performance meter
    performance.mark('endRenderProcess')
    if (GAME.meter) {
      const measure = performance.measure('measureRenderProcess', 'beginRenderProcess', 'endRenderProcess')
      const duration = Math.floor(measure.duration * 1000)
      if (duration > 0) this.meterStack.enqueue(duration)
      this.game.ctx!.fillStyle = 'black'
      this.game.ctx!.fillText(`mms/frame: ${this.meterStack.average(10)}`, 580, 18)
    }
  }

  private updateIsNeeded = (): boolean => {
    return this.game.action !== null && this.game.action !== 'stay'
  }

  // Main update function
  private update = (/* timer: number */) => {
    if (!this.game.paused && this.game.ctx) {
      // Development time patch
      if (this.resource.sprite.cat && !this.resource.sprite.cat.loading) {
        this.render()
      } else {
        console.log('Waiting for GIF image')
        setTimeout(this.update, 500)
      }
    }
  }

  private levelPrepare = () => {
    // Development time patch (React.StrictMode)
    if (this.game.action == 'scene') return

    window.clearTimeout(this.game.timer)
    const level = Math.min(Math.floor(Math.max(this.game.score, 0) / GAME.scorePerLevel), 5)
    this.showLevel(level)
    this.game.SPEED = 0.5 + level * 0.1
    const targets = DIFFICULTY_PER_LEVEL[0] // ToDo change to a level
    const rand = Math.floor(Math.random() * targets.length)
    this.target.nameLast = this.target.nameCurr
    this.target.heightLast = this.target.heightCurr
    this.target.xLast = this.target.xCurr
    this.target.yLast = this.target.yCurr
    this.target.xCurr = Math.floor(Math.max(this.cat.CatX + CANVAS.width / 2, CANVAS.width))
    this.target.yCurr = GAME.defaultTargetY
    this.target.nameCurr = targets[rand]
    this.target.isBarrier = BARRIER_LIST.includes(this.target.nameCurr)
    this.target.PositionX = this.target.isBarrier
      ? GAME.defaultTargetX
      : GAME.defaultTargetX + Math.floor(Math.random() * GAME.animalPositionDelta)
    this.target.heightCurr = this.target.isBarrier
      ? GAME.defaultTargetHeight + GAME.stepTargetHeight * level
      : GAME.defaultTargetHeight
    this.target.runAwayDelay = GAME.defaultRunAwayDelay - GAME.stepTargetDelay * level
    this.game.paused = false
    this.game.movementSpeed = 6
    this.game.fullJump = this.target.nameCurr == 'puddle' || ANIMAL_LIST.includes(this.target.nameCurr)
    this.cat.atPosition = false
    this.target.atPosition = false
    // console.log(`Level ${level}:`, {speed: this.game.SPEED, rand: `${rand}/${targets.length}`, target: this.target})

    if (!this.updateIsNeeded()) requestAnimationFrame(this.update)
    this.game.action = 'scene'
  }

  public start(score = 0, catched: TCatched = this.game.catched) {
    this.draw = new Draw(this.game.ctx!)
    this.fly = new FlyingValues(this.game.ctx!)
    this.Events = new Events(this.game, this.prepareJumpStart, this.prepareJumpEnd, this.pause)
    this.Tooltip = new Tooltip(this.setTooltip)
    this.game.ctx!.font = '18px Arial'
    this.game.score = score
    this.game.catched = catched
    this.Events.registerEvents()
    this.levelPrepare()
    this.Tooltip.show('start')
  }

  public stop() {
    this.Events.unRegisterEvents()
    window.clearTimeout(this.game.timer)
  }

  public pause = (state: boolean) => {
    if (this.game.paused == state) return
    this.game.paused = state
    console.log(`Game: ${this.game.paused ? 'Paused' : 'Continued'}`)

    if (this.game.paused) {
      this.Events.unRegisterEvents()
      this.setPauseVisible(true)
      window.clearTimeout(this.game.timer)
    } else {
      this.Events.registerEvents()
      requestAnimationFrame(this.update)
    }
  }

  public static get({ ctx, handlers }: { ctx?: CanvasRenderingContext2D, handlers?: Record<string, (value?: any) => void> }) {
    if (Engine.__instance) {
      // Renew handlers
      if (handlers) {
        Engine.__instance.setPauseVisible = handlers.setPauseVisible
        Engine.__instance.handleGameOver = handlers.handleGameOver
        Engine.__instance.showLevel = handlers.setLevel
        Engine.__instance.showCombo = handlers.setCombo
        Engine.__instance.setTooltip = handlers.setTooltip
        Engine.__instance.updateScore = handlers.updateScore
        Engine.__instance.updateCatched = handlers.updateCatched
      }
      return Engine.__instance
    }
    if (ctx && handlers) {
      Engine.__instance = new Engine(ctx, handlers)
    }
    return Engine.__instance
  }
}
