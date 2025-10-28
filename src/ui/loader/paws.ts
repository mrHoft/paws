import { iconSrc } from "~/ui/icons";

import modal from '~/ui/modal.module.css'

const pawData = [
  { left: 5, top: 58.57, rotate: 0, delay: 0 },
  { left: 19.12, top: 80, rotate: -5, delay: 0.25 },
  { left: 26.59, top: 41.43, rotate: -10, delay: 0.5 },
  { left: 40.71, top: 65.71, rotate: 5, delay: 0.75 },
  { left: 44.71, top: 10, rotate: 10, delay: 1 },
  { left: 59.76, top: 43.43, rotate: 10, delay: 1.25 },
  { left: 69.41, top: 10, rotate: 20, delay: 1.5 },
  { left: 80, top: 43.43, rotate: 20, delay: 1.75 }
];

interface PawsOptions {
  pawSize: string,
  color: string,
  pawSrc: string
}

export class Paws {
  private container: HTMLDivElement
  private options: PawsOptions
  private pawElements: HTMLDivElement[] = [];
  private animations: Animation[] = [];

  constructor(options: Partial<PawsOptions> = {}) {
    this.options = {
      pawSize: options.pawSize || '6em',
      color: options.color || 'currentColor',
      pawSrc: options.pawSrc || iconSrc.paw
    };

    this.container = document.createElement('div')
    this.container.className = modal.outer;

    this.createPaws();
  }

  createPaws() {
    pawData.forEach(paw => {
      const pawElement = document.createElement('div');
      Object.assign(pawElement.style, {
        position: 'absolute',
        width: this.options.pawSize,
        height: this.options.pawSize,
        background: this.options.color,
        maskImage: `url(${this.options.pawSrc})`,
        WebkitMaskImage: `url(${this.options.pawSrc})`,
        maskSize: this.options.pawSize,
        left: `${paw.left}%`,
        top: `${paw.top}%`,
        transform: `rotate(${paw.rotate}deg)`,
        opacity: '0'
      });

      const animation = pawElement.animate([
        { opacity: 0 },
        { opacity: 0.6, offset: 0.15 },
        { opacity: 0, offset: 0.75 },
        { opacity: 0 }
      ], {
        duration: 5000,
        delay: paw.delay * 1000,
        iterations: Infinity,
        easing: 'linear',
        fill: 'forwards'
      });

      this.pawElements.push(pawElement);
      this.animations.push(animation);
      this.container.appendChild(pawElement);
    });
  }

  public play() {
    this.animations.forEach(animation => animation.play());
  }

  public pause() {
    this.animations.forEach(animation => animation.pause());
  }

  public cancel() {
    this.animations.forEach(animation => animation.cancel());
  }

  public get element() {
    return this.container
  }

  public destroy() {
    this.animations.forEach(animation => animation.cancel());
    this.pawElements.forEach(element => element.remove());
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.pawElements = [];
    this.animations = [];
  }
}
