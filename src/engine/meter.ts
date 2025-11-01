import { GAME, GENERAL } from "~/const"
import { Queue } from "~/utils/queue"

export class PerformanceMeter {
  private ctx: CanvasRenderingContext2D
  private stackSize = GAME.updateTime * GAME.updateModifier * 2.5 // 2.5 seconds
  private meterStack: Queue
  public readonly begin = 'beginRenderProcess'
  public readonly end = 'endRenderProcess'

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
    this.meterStack = new Queue()
  }

  public render = () => {
    const measure = performance.measure('measureRenderProcess', this.begin, this.end)
    const duration = Math.floor(measure.duration * 1000)
    if (duration > 0) this.meterStack.enqueue(duration)
    const fps = Math.floor(10000 / this.meterStack.average(this.stackSize))
    this.ctx.fillStyle = '#cedbf0'
    this.ctx.fillText(`fps: ${fps}`, GENERAL.canvas.width * .75, 32)
  }
}
