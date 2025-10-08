import styles from './weather.module.css'

interface LeafAnimationData {
  horizontalSpeed: number;
  rotationSpeed: number
  swirlFrequency: number;
  swirlAmplitude: number;
}

interface WeatherLeaf extends HTMLImageElement {
  animationData: LeafAnimationData;
  animation?: Animation;
}

interface WeatherOptions {
  leafCount?: number;
}

export class Weather {
  public container: HTMLDivElement;
  private leaves: WeatherLeaf[] = [];
  private isDestroyed: boolean = false;

  constructor(options: WeatherOptions = {}) {
    const { leafCount = 3 } = options;

    this.container = document.createElement('div');
    this.container.className = styles.weather_layer;

    for (let i = 0; i < leafCount; i++) {
      this.addLeaf();
    }
  }

  private createWeatherLeaf(): WeatherLeaf {
    const leaf = document.createElement('img') as WeatherLeaf;
    leaf.src = '/images/leaf_brown.svg';
    leaf.className = styles.weather__leaf;

    leaf.animationData = {
      horizontalSpeed: Math.floor(10000 + Math.random() * 10000), // 10-20 seconds in milliseconds
      rotationSpeed: Math.floor((Math.random() * 3 + 2) * 10) / 10,
      swirlFrequency: 0.5 + Math.random() * 1, // 0.5-1.5 Hz
      swirlAmplitude: 10 + Math.random() * 20 // 10-30px
    };

    return leaf;
  }

  private addLeaf(): void {
    const leaf = this.createWeatherLeaf();
    this.container.appendChild(leaf);
    this.leaves.push(leaf);
    this.setRandomLeafProperties(leaf);
    this.animateLeaf(leaf);
  }

  private setRandomLeafProperties(leaf: WeatherLeaf): void {
    const top = 90 - Math.pow(Math.random(), 2) * 85; // 5-90% from top
    leaf.style.top = `${top}%`;
    leaf.style.left = '0';
    const size = 20 + Math.random() * 15;
    leaf.style.width = leaf.style.height = `${size}px`;
  }

  private animateLeaf(leaf: WeatherLeaf): void {
    if (this.isDestroyed) return;

    const data = leaf.animationData;

    const xKeyframes = [
      { transform: `translateX(0) rotate(0deg)` },
      { transform: `translateX(100vw) rotate(${-data.rotationSpeed * 360}deg)` }
    ];
    const xOptions: KeyframeAnimationOptions = {
      duration: data.horizontalSpeed,
      iterations: 1,
      fill: 'forwards'
    };

    leaf.animation = leaf.animate(xKeyframes, xOptions);
    leaf.animation.onfinish = () => {
      if (this.isDestroyed) return;
      this.setRandomLeafProperties(leaf);
      this.animateLeaf(leaf);
    };
  }

  public addLeaves(count: number = 1): void {
    if (this.isDestroyed) {
      return;
    }

    for (let i = 0; i < count; i++) {
      this.addLeaf();
    }
  }

  public removeLeaves() {
    if (this.isDestroyed) return;

    this.leaves.forEach(leaf => {
      if (leaf.animation) {
        leaf.animation.cancel();
      }
      leaf.remove();
    });
    this.leaves = [];
  }

  public destroy() {
    if (this.isDestroyed) return;

    this.removeLeaves();
    this.container.remove();
    this.isDestroyed = true;
  }

  public get leafCount() {
    return this.leaves.length;
  }

  public pause(state: boolean) {
    if (state) {
      this.leaves.forEach(leaf => {
        if (leaf.animation) {
          leaf.animation.pause();
        }
      });
    } else {
      this.leaves.forEach(leaf => {
        if (leaf.animation) {
          leaf.animation.play();
        }
      });
    }
  }

  public get element() {
    return this.container
  }
}
/*
function createLeafAnimation({ element, speedX, speedY }: { element: HTMLElement, speedX: number, speedY: number }) {
  const randomY = Math.pow(Math.random(), 2) * 90 + 5;
  const randomCubicBezier = `cubic-bezier(${Math.random()}, ${Math.random()}, ${Math.random()}, ${Math.random()})`;
  // Default: cubic-bezier(0.25, 0.1, 0.25, 1)

  const xKeyframes = [
    { transform: `translateX(0vw) rotate(0deg)` },
    { transform: `translateX(100vw) rotate(720deg)` }
  ];

  const yKeyframes = [
    { transform: `translateY(${randomY}%)` },
    { transform: `translateY(${(randomY + 50) % 100}%)` }
  ];

  // X animation - runs once
  const xOptions: KeyframeAnimationOptions = {
    duration: Math.max(speedX, 100),
    iterations: 1,
    fill: 'forwards'
  };

  // Y animation - runs infinitely
  const yOptions: KeyframeAnimationOptions = {
    duration: Math.max(speedY, 100),
    iterations: Infinity,
    easing: randomCubicBezier,
    direction: 'alternate'
  };

  // Apply both animations
  element.animate(xKeyframes, xOptions);
  // element.animate(yKeyframes, yOptions);
}
 */
