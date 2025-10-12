import { ANIMAL_LIST, BARRIER_LIST, CANVAS, TARGETS_PER_LEVEL, GAME, TARGET_SCORE, type TAnimalName, type TLevelName } from '~/const'
import { Draw } from './draw'
import { Resource } from './resource'
import { Backdrop } from './backdrop'
import { FlyingValues } from './flyingValues'
import { ControlEvents } from './events'
import { Tooltip } from './tooltip'
import type { Target, TCat, TCaught, TGame } from './types'
import type { GifObject } from '~/utils/gif'
import { Queue } from '~/utils/queue'
import { Sound } from '~/utils/sound'
import { AdvancedShepardTone } from '~/utils/shepardTone'

const caughtDefault: TCaught = {
  butterfly: 0,
  grasshopper: 0,
  frog: 0,
  bird: 0,
  mouse: 0,
}

export class Engine {
  private sound: Sound
  private game: TGame = {
    levelName: 'default',
    SPEED: 0.5, // Game complexity (normal: 0.5 fast: 1)
    successHeightModifier: 1.3, // Defines jump to target height ratio
    // Frame reit, actually no :). Updates automatically.
    get updateTime(): number {
      return Math.floor(17 / this.SPEED)
    },
    action: null,
    ctx: null,
    definingTrajectory: false, // Jump attempt state
    timer: 0, // setTimeout link
    movementSpeed: 10,
    runAwaySpeed: 10,
    successHeight: GAME.defaultTargetHeight,
    success: false,
    fullJump: true, // To know does current target need a full jump
    paused: false,
    combo: 0, // Combo multiplier for score
    score: 0,
    caught: { ...caughtDefault }
  }
  private cat: TCat = {
    source: {} as GifObject,
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
  private tone: AdvancedShepardTone
  private fly: FlyingValues
  private events: ControlEvents
  private tooltip: Tooltip
  private backdrop: Backdrop
  private meterStack = new Queue()
  private handlePause: (pause: boolean) => void
  // private handleGameOver: () => void
  private showLevel: (value: number) => void
  private showCombo: (value: number) => void
  private showTooltip: (tooltip: string) => void
  private updateScore: (score: number) => void
  private updateCaught: (id: keyof TCaught) => void
  private resetCaught: () => void
  private static __instance: Engine

  private constructor(ctx: CanvasRenderingContext2D, handlers: Record<string, (value?: any) => void>) {
    this.handlePause = handlers.handlePause
    // this.handleGameOver = handlers.handleGameOver
    this.showLevel = handlers.setLevel
    this.showCombo = handlers.setCombo
    this.showTooltip = handlers.showTooltip
    this.updateScore = handlers.updateScore
    this.updateCaught = handlers.updateCaught
    this.resetCaught = handlers.resetCaught

    this.sound = new Sound()
    this.tone = new AdvancedShepardTone({
      baseFrequency: 220,
      numOscillators: 2,
      cycleDuration: 6.0,
      oscillatorType: 'sine',
      volume: 0.1,
      direction: 'ascending'
    });

    this.game.ctx = ctx
    this.game.successHeight = GAME.defaultTargetHeight * this.game.successHeightModifier
    this.draw = new Draw(this.game.ctx!)
    this.fly = new FlyingValues(this.game.ctx!)
    this.backdrop = new Backdrop({ ctx })
    this.events = new ControlEvents({ game: this.game, prepareJumpStart: this.prepareJumpStart, prepareJumpEnd: this.prepareJumpEnd, pause: this.pause })
    this.tooltip = new Tooltip(this.showTooltip)

    this.resource = Resource.get()
    this.cat.source = this.resource.sprite.cat as GifObject
  }

  private setScore = (value: number, multiplier = 1) => {
    const combo = Math.max(this.game.combo, 1)
    this.game.score += value * multiplier * combo
    if (this.game.score < 0) this.game.score = 0
    this.updateScore(this.game.score)
    if (value != 0) this.fly.throw(value * combo, multiplier, this.cat.CatX)
    if (this.game.success) this.tooltip.hide()
  }

  private commitFail = (reason?: 'timeout') => {
    /* Game over mechanics
      if (this.game.score + TARGET_SCORE[this.target.nameCurr].fail < 0) {
        this.game.score = 0
        this.game.paused = true
        this.game.action = null
        this.handleGameOver()
        return
      }
    */
    this.tooltip.show(reason || (this.target.isBarrier ? 'barrier' : 'animal'))
    if (this.target.isBarrier) this.sound.use('impact')

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
          this.sound.use('combo')
        }
      }
      const name: TAnimalName = this.target.nameCurr as TAnimalName

      this.updateCaught(name)
      this.sound.use('catch')
      this.target.nameCurr = 'none'
    }
    this.levelPrepare()
  }

  private prepareJumpStart = () => {
    if (!this.sound.sound.muted) {
      this.tone.direction = 'ascending'
      this.tone.start();
    }
    this.cat.jumpHeight = GAME.jumpHeightMin
    this.cat.trajectoryDirection = 1
    this.game.definingTrajectory = true
    if (!this.updateIsNeeded()) {
      requestAnimationFrame(this.update)
    }
  }

  private prepareJumpEnd = () => {
    this.tone.stop();
    this.game.definingTrajectory = false
    // Prevent accidental taps
    if (this.cat.jumpHeight > GAME.jumpHeightMin + GAME.trajectoryStep * 2) {
      this.sound.use('jump')
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
    if (this.cat.jumpHeight >= GAME.jumpHeightMax) {
      this.cat.trajectoryDirection = -1
      this.tone.direction = 'descending'
    }
    if (this.cat.jumpHeight < GAME.jumpHeightMin) {
      // Stops jump request
      this.game.action = 'stay'
      this.game.definingTrajectory = false
      this.cat.jumpStage = -Math.PI
      this.tone.stop();
      return
    }
    this.draw.drawTrajectory(this.cat.CatX, this.cat.CatY, this.cat.jumpHeight, !this.target.isBarrier)
  }

  private defineJump = () => {
    const modifier = this.target.isBarrier ? 1 : 0.6
    const r = this.cat.jumpHeight // Circle radius
    const points = r / 5 // Position count
    const step = Math.PI / points / modifier
    this.cat.jumpStage += step
    const i = this.cat.jumpStage
    if (!this.game.fullJump && !this.game.success && i > -Math.PI / 2) {
      this.commitFail()
    }
    if (i < 0) {
      this.cat.CatX = Math.floor(GAME.defaultCatX + r + r * Math.cos(i))
      const y = this.cat.CatY + r * Math.sin(i) * modifier
      const frameIndex = Math.floor(((i + Math.PI) / Math.PI) * 7)
      this.draw.drawCat(this.cat.source.frames[frameIndex].image, this.cat.CatX, y)
    } else {
      this.game.success ? this.commitSuccess() : this.commitFail()
    }
  }

  private scrollSpeed = () => this.cat.atPosition ? this.game.movementSpeed : Math.floor((this.game.movementSpeed / 2) * 3)

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
    this.target.xCurr -= this.scrollSpeed()
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

    this.target.xLast -= this.scrollSpeed()
    return
  }

  private render = () => {
    // Development time patch
    if (!this.cat.source) this.cat.source = this.resource.sprite.cat as GifObject
    performance.mark('beginRenderProcess')
    this.game.ctx!.clearRect(0, 0, CANVAS.width, CANVAS.height)
    if (!this.target.atPosition && (this.game.action == 'return' || this.game.action == 'scene')) {
      this.backdrop.move(this.scrollSpeed())
    } else {
      this.backdrop.draw()
    }

    this.draw.drawTarget(this.target.nameCurr, this.target.xCurr, this.target.yCurr, this.target.heightCurr)

    if (this.game.definingTrajectory) this.defineTrajectory()

    switch (this.game.action) {
      case 'return':
        this.sceneChange()
        this.draw.drawCat(this.cat.source.image!, this.cat.CatX, this.cat.CatY)
        break
      case 'scene':
        this.sceneChange()
        this.draw.drawCat(this.cat.source.image!, this.cat.CatX, this.cat.CatY)
        break
      case 'run':
        this.draw.drawCat(this.cat.source.image!, this.cat.CatX, this.cat.CatY)
        break
      case 'jump':
        this.defineJump()
        break
      default: // 'stay'
        this.draw.drawCat(this.cat.source.frames[0].image, this.cat.CatX, this.cat.CatY)
    }
    this.fly.render()
    if (this.game.definingTrajectory || this.updateIsNeeded()) setTimeout(this.update, this.game.updateTime)
    // Performance meter
    performance.mark('endRenderProcess')
    if (GAME.meter) {
      const measure = performance.measure('measureRenderProcess', 'beginRenderProcess', 'endRenderProcess')
      const duration = Math.floor(measure.duration * 1000)
      if (duration > 0) this.meterStack.enqueue(duration)
      const fps = Math.floor(10000 / this.meterStack.average(10))
      this.game.ctx!.fillStyle = '#cedbf0'
      this.game.ctx!.fillText(`fps: ${fps}`, CANVAS.width * .75, 18)
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
    window.clearTimeout(this.game.timer)

    const level = Math.min(Math.floor(Math.max(this.game.score, 0) / GAME.scorePerLevel), 5)
    this.showLevel(level)
    this.game.SPEED = 0.5 + level * 0.1
    const targets = TARGETS_PER_LEVEL[this.game.levelName]

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
      ? GAME.defaultTargetHeight * (1 + 0.1 * level)
      : GAME.defaultTargetHeight
    this.target.runAwayDelay = GAME.defaultRunAwayDelay * (1 - 0.1 * level)
    this.game.paused = false
    this.game.movementSpeed = 10
    this.game.fullJump = this.target.nameCurr == 'puddle' || ANIMAL_LIST.includes(this.target.nameCurr as TAnimalName)
    this.cat.atPosition = false
    this.target.atPosition = false
    // console.log(`Level ${level}:`, {speed: this.game.SPEED, rand: `${rand}/${targets.length}`, target: this.target})

    if (!this.updateIsNeeded()) requestAnimationFrame(this.update)
    this.game.action = 'scene'
  }

  public start(options: { levelName?: TLevelName, restart?: boolean } = {}) {
    const { levelName = this.game.levelName, restart } = options
    this.draw = new Draw(this.game.ctx!)
    this.fly = new FlyingValues(this.game.ctx!)
    this.events = new ControlEvents({ game: this.game, prepareJumpStart: this.prepareJumpStart, prepareJumpEnd: this.prepareJumpEnd, pause: this.pause })
    this.tooltip = new Tooltip(this.showTooltip)
    this.backdrop.init(levelName)
    this.sound.play(0, true)  // TODO: level music

    this.game.ctx!.font = '20px Arial'
    this.game.levelName = levelName
    this.game.paused = false
    this.game.action = null
    this.events.registerEvents()
    this.levelPrepare()
    this.tooltip.show('start')

    this.game.combo = 0
    this.showCombo(this.game.combo)

    if (restart) {
      console.log('Game restarted')
      this.game.score = 0
      this.game.caught = { ...caughtDefault }
      this.updateScore(this.game.score)
      this.resetCaught()
    }
  }

  public stop() {
    this.events.unRegisterEvents()
    window.clearTimeout(this.game.timer)
    this.sound.pause()
  }

  public pause = (state: boolean) => {
    if (this.game.paused == state) return
    this.game.paused = state
    console.log(`Game ${this.game.paused ? 'paused' : 'continued'}`)

    if (this.game.paused) {
      this.events.unRegisterEvents()
      this.handlePause(true)
      window.clearTimeout(this.game.timer)
    } else {
      this.events.registerEvents()
      requestAnimationFrame(this.update)
    }
  }

  public static get({ ctx, handlers }: { ctx?: CanvasRenderingContext2D, handlers?: Record<string, (value?: any) => void> }) {
    if (Engine.__instance) {
      // Renew handlers
      if (handlers) {
        Engine.__instance.handlePause = handlers.handlePause
        // Engine.__instance.handleGameOver = handlers.handleGameOver
        Engine.__instance.showLevel = handlers.setLevel
        Engine.__instance.showCombo = handlers.setCombo
        Engine.__instance.showTooltip = handlers.showTooltip
        Engine.__instance.updateScore = handlers.updateScore
        Engine.__instance.updateCaught = handlers.updateCaught
        Engine.__instance.resetCaught = handlers.resetCaught
      }
      return Engine.__instance
    }
    if (ctx && handlers) {
      Engine.__instance = new Engine(ctx, handlers)
    }
    return Engine.__instance
  }
}
