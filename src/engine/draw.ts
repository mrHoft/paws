import { GAME, SpriteSize } from '~/const'
import { Resource } from './resource'
import { inject } from '~/utils/inject'

export class Draw {
  private ctx: CanvasRenderingContext2D
  private sizeModifier = 1
  private resource: Resource

  constructor({ ctx }: { ctx: CanvasRenderingContext2D }) {
    this.ctx = ctx
    this.resource = inject(Resource)
  }

  public setup = ({ sizeModifier = 1 }: { sizeModifier?: number }) => {
    this.sizeModifier = sizeModifier
  }
  /*
  // Simple
  private drawShadow = (x: number, y: number, width: number, force = false) => {
    if (GAME.shadowsEnable || force) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'
      this.ctx.beginPath()
      this.ctx.ellipse(x, y, width / 4, width / 10, 0, 0, 2 * Math.PI)
      this.ctx.fill()
    }
  }
  */

  // With context scaling to make shadow look like an ellipse
  private drawShadow = (x: number, y: number, width: number, force = false) => {
    if (GAME.shadowsEnable || force) {
      const shadowWidth = width / 4;
      const shadowHeight = width / 10;

      this.ctx.save();

      this.ctx.translate(x, y);
      this.ctx.scale(1, shadowHeight / shadowWidth);

      const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, shadowWidth * 1.2);

      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.25)');
      gradient.addColorStop(0.65, 'rgba(0, 0, 0, 0.20)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, shadowWidth, 0, 2 * Math.PI);
      this.ctx.fill();

      this.ctx.restore();
    }
  }

  public drawObject = (image: HTMLCanvasElement, x: number, y: number, height: number) => {
    const width = (image.width * height) / image.height

    this.drawShadow(x, GAME.actionPositionVertical, width)
    this.ctx.drawImage(image, x - width / 2, y - height, width, height)
  }

  public drawCat = (image: HTMLCanvasElement, x: number, y: number) => {
    this.drawObject(image, x, y, SpriteSize.cat.height * this.sizeModifier)
  }
  /*
  public drawTrajectory_simple = (x: number, y: number, jumpHeight: number, forward = true) => {
    const width = jumpHeight * (forward ? 0.5 : 1)

    // Outer path
    const gradient1 = this.ctx.createLinearGradient(x, y - 10, x + jumpHeight * 2, y - 10)
    gradient1.addColorStop(0, 'rgba(122, 208, 41, 0)')
    gradient1.addColorStop(1, 'rgba(70, 119, 24, 1)')
    this.ctx.strokeStyle = gradient1  //'rgba(70, 119, 24, 0.5)'
    this.ctx.beginPath()
    this.ctx.ellipse(x + jumpHeight, y - 10, jumpHeight, width, 0, Math.PI, 0)
    this.ctx.lineWidth = 12
    this.ctx.stroke()

    // Inner path
    const gradient2 = this.ctx.createLinearGradient(x, y - 10, x + jumpHeight * 2, y - 10)
    gradient2.addColorStop(0, 'rgba(122, 208, 41, 0)')
    gradient2.addColorStop(1, 'rgba(122, 208, 41, 1)')

    this.ctx.strokeStyle = gradient2  // 'rgba(122, 208, 41, 0.5)'
    this.ctx.beginPath()
    this.ctx.ellipse(x + jumpHeight, y - 10, jumpHeight, width, 0, Math.PI, 0)
    this.ctx.lineWidth = 6
    this.ctx.stroke()
  }
  */
  public drawTrajectory_segmented = (x: number, y: number, jumpHeight: number, forward = true) => {
    const width = jumpHeight * (forward ? 0.5 : 1)
    const segments = 50;
    const maxLineWidth = 14;

    const gradient = this.ctx.createLinearGradient(x, y - 10, x + jumpHeight * 2, y - 10
    )
    gradient.addColorStop(0, 'rgba(122, 208, 41, 0)')
    gradient.addColorStop(1, 'rgba(122, 208, 41, 1)')

    this.ctx.strokeStyle = gradient

    for (let i = 0; i < segments; i++) {
      const startAngle = Math.PI + (i / segments) * Math.PI;
      const endAngle = Math.PI + ((i + 1) / segments) * Math.PI;

      const progress = (i + 1) / segments;
      const lineWidth = progress * maxLineWidth;

      this.ctx.lineWidth = lineWidth;

      this.ctx.beginPath();
      this.ctx.ellipse(x + jumpHeight, y - 10, jumpHeight, width, 0, startAngle, endAngle);
      this.ctx.stroke();
    }
  }

  public drawTrajectory = (x: number, y: number, jumpHeight: number, forward = true) => {
    this.drawShadow(x + jumpHeight * 2, y, SpriteSize.cat.width, true)
    this.drawTrajectory_segmented(x, y, jumpHeight, forward)
  }

  public drawTarget = (name: string, x: number, y: number, height: number, animate = false) => {
    height = height * this.sizeModifier
    const image = this.resource.sprite[name]
    if (image instanceof HTMLImageElement) {
      let width = (image.width * height) / image.height
      let newY = Math.floor(y - height * 0.9)
      if (name == 'puddle') {
        width = Math.floor(width / 1.2)
        height = height / 2
        newY = y - height / 2
      }
      const newX = x - width / 2
      // if (name != 'puddle') this.drawShadow(tx, ty, w)
      this.ctx.drawImage(image, newX, newY, width, height)
    } else {
      // GifObject
      const frame = animate ? image.image! : image.frames[0].image
      this.drawObject(frame, x, y + height / 8, height / 1.5)
    }
  }
}
