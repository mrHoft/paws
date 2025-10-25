import { ANIMALS, OBSTACLES, CANVAS, GAME, TARGET_SCORE, type TAnimalName } from '~/const'
import { Draw } from './draw'
import { Resource } from './resource'
import { Backdrop } from './backdrop'
import { FlyingValues } from './flyingValues'
import { EventsService } from './events'
import { Tooltip } from './tooltip'
import { PerformanceMeter } from './meter'
import { TargetService } from './target'
import type { Target, TCat, TCaught, TGame, EngineOptions } from './types'
import type { GifObject } from '~/utils/gif'
import { Audio } from '~/service/audio'
import { ShepardTone } from '~/service/shepardTone'
import { inject } from '~/utils/inject'

interface EngineHandlers {
  handlePause: (_state: boolean) => void,
  handleGameOver: () => void,
  setLevel: (_value: number) => void,
  setCombo: (_value: number) => void,
  updateScore: (_value: number) => void,
  updateCaught: (_id: string) => void,
  resetCaught: () => void,
  showTooltip: (_id: string) => void,
}

const caughtDefault: TCaught = {
  butterfly: 0,
  grasshopper: 0,
  frog: 0,
  bird: 0,
  mouse: 0,
}

export class Engine {
  private audio: Audio
  private ctx: CanvasRenderingContext2D
  private game: TGame = {
    sceneName: 'default',
    level: 0, // Game complexity level (normal: 0 fast: 5)
    movementSpeed: Math.floor(GAME.movementSpeed * GAME.updateModifier * 1000) / 1000,
    runAwaySpeed: Math.floor(GAME.movementSpeed * 1.2 * GAME.updateModifier * 1000) / 1000,
    jumpStep: Math.floor(5 / GAME.updateModifier * 1000) / 1000,
    updateTime: Math.floor(GAME.updateTime / GAME.updateModifier / 0.5), // Frame reit, actually no :)
    action: null,
    ctx: null,
    fps: true,
    definingTrajectory: false, // Jump attempt state
    timer: 0, // setTimeout link
    successHeightModifier: 1.3, // Defines jump to target height ratio
    success: false,
    fullJump: true, // To know does current target need a full jump
    paused: false,
    stopped: true,
    combo: 0, // Combo multiplier for score
    score: 0,
    caught: { ...caughtDefault }
  }
  private cat: TCat = {
    source: {} as GifObject,
    jumpHeight: GAME.jumpHeightMin,
    jumpStage: 0,
    trajectoryDirection: 1,
    x: GAME.defaultCatX,
    y: GAME.defaultCatY,
    atPosition: false,
  }
  private target: Target = {
    nameCurr: 'none',
    nameLast: 'none',
    xCurr: this.cat.x + CANVAS.width / 2,
    yCurr: GAME.defaultTargetY,
    xLast: GAME.defaultTargetX,
    yLast: GAME.defaultTargetY,
    PositionX: GAME.defaultTargetX, // A place where a target will stop
    heightCurr: GAME.defaultAnimalHeight,
    heightLast: GAME.defaultAnimalHeight,
    isBarrier: false,
    runAwayDelay: GAME.defaultRunAwayDelay,
    atPosition: false,
  }
  private resource: Resource
  private draw: Draw
  private tone: ShepardTone
  private flyingValues: FlyingValues
  private events: EventsService
  private targetService: TargetService
  private tooltip: Tooltip
  private backdrop: Backdrop
  private meter: PerformanceMeter
  private handlePause: (pause: boolean) => void
  private showLevel: (value: number) => void
  private showCombo: (value: number) => void
  private showTooltip: (tooltip: string) => void
  private updateScore: (score: number) => void
  private updateCaught: (id: string) => void
  private resetCaught: () => void
  // private handleGameOver: () => void

  constructor({ ctx, handlers, initialScore }: { ctx: CanvasRenderingContext2D, handlers: EngineHandlers, initialScore?: number }) {
    this.handlePause = handlers.handlePause
    this.showLevel = handlers.setLevel
    this.showCombo = handlers.setCombo
    this.showTooltip = handlers.showTooltip
    this.updateScore = handlers.updateScore
    this.updateCaught = handlers.updateCaught
    this.resetCaught = handlers.resetCaught
    // this.handleGameOver = handlers.handleGameOver

    this.ctx = ctx
    this.ctx.font = '32px Arial'

    if (initialScore) this.game.score = initialScore

    this.audio = inject(Audio)
    this.tone = inject(ShepardTone)
    this.targetService = inject(TargetService)
    this.resource = inject(Resource)
    this.cat.source = this.resource.sprite.cat as GifObject
    this.meter = new PerformanceMeter(this.ctx)
    this.draw = new Draw({ ctx })
    this.flyingValues = new FlyingValues(this.ctx)
    this.backdrop = new Backdrop({ ctx })
    this.tooltip = new Tooltip(this.showTooltip)
    this.events = inject(EventsService)
  }

  private setScore = (value: number, multiplier = 1) => {
    const combo = Math.max(this.game.combo, 1)
    this.game.score += value * multiplier * combo
    if (this.game.score < 0) this.game.score = 0
    this.updateScore(this.game.score)
    if (value != 0) this.flyingValues.throw(value * combo, multiplier, this.cat.x)
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
    if (this.target.isBarrier) this.audio.use('impact')

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
          this.flyingValues.throw('Combo:', this.game.combo, this.cat.x)
          this.audio.use('combo')
        }
      }
      const name: TAnimalName = this.target.nameCurr as TAnimalName

      this.updateCaught(name)
      this.audio.use('catch')
      this.target.nameCurr = 'none'
    }
    this.levelPrepare()
  }

  private prepareJumpStart = () => {
    if (this.game.stopped || this.game.paused) return
    if (!this.audio.sound.muted) {
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
    if (this.game.stopped || this.game.paused) return
    this.tone.stop();
    this.game.definingTrajectory = false
    // Prevent accidental taps
    if (this.cat.jumpHeight > GAME.jumpHeightMin + GAME.trajectoryStep * 2) {
      this.audio.use('jump')
      this.game.action = 'jump'
      this.cat.atPosition = false
      this.cat.jumpStage = -Math.PI
      let successHeight = this.target.isBarrier
        ? Math.floor(
          this.target.heightCurr * this.game.successHeightModifier + (this.target.xCurr - this.target.PositionX) / 2
        )
        : Math.floor((this.target.xCurr - this.cat.x) / 2)
      this.game.success =
        (this.target.isBarrier && this.cat.jumpHeight > successHeight) ||
        Math.abs(this.cat.jumpHeight - successHeight) < GAME.catchRange
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
    this.draw.drawTrajectory(this.cat.x, this.cat.y, this.cat.jumpHeight, !this.target.isBarrier)
  }

  private defineJump = () => {
    const modifier = this.target.isBarrier ? 1 : 0.6
    const r = this.cat.jumpHeight // Trajectory curve radius
    const points = r / this.game.jumpStep // Position count
    const step = Math.PI / points / modifier
    this.cat.jumpStage += step
    const i = this.cat.jumpStage
    if (!this.game.fullJump && !this.game.success && i > -Math.PI / 2) {
      this.commitFail()
    }
    if (i < 0) {
      this.cat.x = Math.floor(GAME.defaultCatX + r + r * Math.cos(i))
      const y = this.cat.y + r * Math.sin(i) * modifier
      const frameIndex = Math.floor(((i + Math.PI) / Math.PI) * 7)
      this.draw.drawCat(this.cat.source.frames[frameIndex].image, this.cat.x, y)
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
    if (this.cat.x > GAME.defaultCatX) {
      this.cat.x -= this.target.atPosition ? Math.floor((this.game.movementSpeed / 3) * 2) : this.game.movementSpeed
    } else {
      this.cat.atPosition = true
    }

    if (this.cat.atPosition && this.target.atPosition) {
      setTimeout(() => (this.game.action = 'stay'), 0)
    }
  }

  private runAway = () => {
    const speed = this.game.runAwaySpeed
    if (this.target.nameLast.startsWith('butterfly') || this.target.nameLast.startsWith('bird')) {
      this.target.xLast -= speed * (this.target.nameLast.startsWith('bird') ? 1.8 : 1.4)
      this.target.yLast -= this.target.nameLast.startsWith('butterfly') ? Math.random() * speed : speed
      return
    }

    if (this.target.nameLast.startsWith('grasshopper') || this.target.nameLast.startsWith('frog')) {
      this.target.xLast -= speed * 1.5
      return
    }

    if (this.target.nameLast.startsWith('mouse')) {
      this.target.xLast += speed
      return
    }

    this.target.xLast -= this.scrollSpeed()
    return
  }

  private render = () => {
    performance.mark(this.meter.begin)
    this.ctx.clearRect(0, 0, CANVAS.width, CANVAS.height)
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
        this.draw.drawCat(this.cat.source.image!, this.cat.x, this.cat.y)
        break
      case 'scene':
        this.sceneChange()
        this.draw.drawCat(this.cat.source.image!, this.cat.x, this.cat.y)
        break
      case 'run':
        this.draw.drawCat(this.cat.source.image!, this.cat.x, this.cat.y)
        break
      case 'jump':
        this.defineJump()
        break
      default: // 'stay'
        this.draw.drawCat(this.cat.source.frames[0].image, this.cat.x, this.cat.y)
    }
    this.flyingValues.render()

    performance.mark(this.meter.end)
    if (this.game.fps && this.game.multiplayer === undefined) this.meter.render()

    if (this.game.definingTrajectory || this.updateIsNeeded()) setTimeout(this.update, this.game.updateTime)
  }

  private updateIsNeeded = (): boolean => {
    return this.game.action !== null && this.game.action !== 'stay'
  }

  // Main update function
  private update = (/* timer: number */) => {
    if (!this.game.paused) {
      // Development time patch
      if (this.resource.sprite.cat && !this.resource.sprite.cat.loading) {
        this.render()
      }
    }
  }

  private levelPrepare = () => {
    window.clearTimeout(this.game.timer)

    const level = Math.min(Math.floor(Math.max(this.game.score, 0) / GAME.scorePerLevel), 5)
    if (level !== this.game.level) {
      this.game.level = level
      const speed = Math.min(0.5 + level * 0.1, 1)
      this.game.updateTime = Math.floor(GAME.updateTime / GAME.updateModifier / speed)
      this.showLevel(level)
    }

    this.target.nameLast = this.target.nameCurr
    this.target.heightLast = this.target.heightCurr
    this.target.xLast = this.target.xCurr
    this.target.yLast = this.target.yCurr
    this.target.xCurr = Math.floor(Math.max(this.cat.x + CANVAS.width / 2, CANVAS.width))
    this.target.yCurr = GAME.defaultTargetY / (this.game.multiplayer ? 2 : 1) + (this.game.multiplayer === 'bottom' ? CANVAS.height / 2 : 0)
    this.target.nameCurr = this.targetService.getTarget(this.game.multiplayer)
    this.target.isBarrier = OBSTACLES.includes(this.target.nameCurr)
    this.target.PositionX = this.target.isBarrier
      ? GAME.defaultTargetX
      : GAME.defaultTargetX + Math.floor(Math.random() * GAME.animalPositionDelta)
    this.target.heightCurr = this.target.isBarrier
      ? GAME.defaultObstacleHeight * (1 + 0.1 * level)
      : GAME.defaultAnimalHeight
    this.target.runAwayDelay = GAME.defaultRunAwayDelay * (1 - 0.1 * level)
    this.game.paused = false
    this.game.fullJump = this.target.nameCurr == 'puddle' || ANIMALS.includes(this.target.nameCurr as TAnimalName)
    this.cat.atPosition = false
    this.target.atPosition = false
    // console.log(`Level ${level}:`, {speed: this.game.SPEED, rand: `${rand}/${targets.length}`, target: this.target})

    if (!this.updateIsNeeded()) requestAnimationFrame(this.update)
    this.game.action = 'scene'
  }

  public start(options: EngineOptions = {}) {
    const { sceneName = this.game.sceneName, restart, fps, multiplayer, control = 'any' } = options

    this.game.multiplayer = multiplayer
    if (multiplayer) {
      this.cat.y = GAME.defaultCatY / 2
      this.target.yCurr = GAME.defaultTargetY / 2
      this.target.yLast = GAME.defaultTargetY / 2
      if (multiplayer === 'bottom') {
        this.cat.y += CANVAS.height / 2
        this.target.yCurr += CANVAS.height / 2
        this.target.yLast += CANVAS.height / 2
      }
    } else {
      this.cat.y = GAME.defaultCatY
    }

    const sizeModifier = multiplayer ? 0.7 : 1
    this.draw.setup({ sizeModifier })
    this.backdrop.setup({ sceneName, multiplayer })
    this.targetService.setup({ sceneName, multiplayer })
    this.events.registerControl(control, {
      game: this.game,
      prepareJumpStart: this.prepareJumpStart,
      prepareJumpEnd: this.prepareJumpEnd,
      pause: this.pause
    })

    this.audio.musicMute = false
    this.audio.play(0, true)  // TODO: level music

    this.game.sceneName = sceneName
    this.game.stopped = false
    this.game.paused = false
    this.game.action = null
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

    if (fps !== undefined) this.game.fps = fps
  }

  public stop() {
    window.clearTimeout(this.game.timer)
    this.audio.pause()
    this.game.stopped = true
  }

  public pause = (state: boolean) => {
    if (this.game.stopped || this.game.paused == state) return
    this.game.paused = state
    console.log(`Game ${this.game.paused ? 'paused' : 'continued'}`)

    if (this.game.paused) {
      this.handlePause(true)
      window.clearTimeout(this.game.timer)
      this.audio.musicMute = true
    } else {
      requestAnimationFrame(this.update)
      this.audio.musicMute = false
    }
  }
}
