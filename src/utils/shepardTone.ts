// Shepard tone usage example:
/*
// Basic usage
const basicTone = new ShepardTone({
  baseFrequency: 110,
  cycleDuration: 3.0,
  volume: 0.2
});

// Advanced usage with direction control
const advancedTone = new AdvancedShepardTone({
  baseFrequency: 220,
  numOscillators: 5,
  cycleDuration: 4.0,
  oscillatorType: 'sine',
  volume: 0.15,
  direction: 'descending'
});

// Start the tones
basicTone.start();
advancedTone.start();

// Change properties dynamically
setTimeout(() => {
  advancedTone.setDirection('ascending');
  advancedTone.setCycleDuration(2.0);
}, 5000);

// Stop after 10 seconds
setTimeout(() => {
  basicTone.stop();
  advancedTone.stop();
}, 10000);
*/

type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle';

interface ShepardToneConfig {
  baseFrequency?: number;
  numOscillators?: number;
  cycleDuration?: number;
  oscillatorType?: OscillatorType;
  volume?: number;
}

class ShepardTone {
  protected audioContext: AudioContext | null = null;
  protected oscillators: OscillatorNode[] = [];
  protected gainNodes: GainNode[] = [];
  protected isPlaying: boolean = false;
  protected animationFrameId: number | null = null;
  protected startTime: number = 0;

  protected baseFrequency: number;
  protected numOscillators: number;
  protected cycleDuration: number;
  protected oscillatorType: OscillatorType;
  protected volume: number;

  constructor(config: ShepardToneConfig = {}) {
    this.baseFrequency = config.baseFrequency || 220;
    this.numOscillators = config.numOscillators || 4;
    this.cycleDuration = config.cycleDuration || 2.0;
    this.oscillatorType = config.oscillatorType || 'sine';
    this.volume = config.volume || 0.3;
  }

  public start(): void {
    if (this.isPlaying) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      this.isPlaying = true;
      this.startTime = this.audioContext.currentTime;

      this.createOscillators();
      this.updateTone();

      console.log('Shepard Tone started');
    } catch (error) {
      console.error('Failed to start Shepard Tone:', error);
      this.isPlaying = false;
    }
  }

  public stop(): void {
    if (!this.isPlaying) return;

    this.isPlaying = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.oscillators.forEach(oscillator => {
      try {
        oscillator.stop();
      } catch (error) {
      }
    });

    this.oscillators = [];
    this.gainNodes = [];

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(console.error);
    }

    console.log('Shepard Tone stopped');
  }

  public setCycleDuration(duration: number): void {
    this.cycleDuration = Math.max(0.1, duration);
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  protected createOscillators(): void {
    if (!this.audioContext) return;

    const currentTime = this.audioContext.currentTime;

    for (let i = 0; i < this.numOscillators; i++) {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode as AudioNode);
      gainNode.connect(this.audioContext.destination);

      const baseFreq = this.baseFrequency * Math.pow(2, i);
      oscillator.frequency.setValueAtTime(baseFreq, currentTime);
      oscillator.type = this.oscillatorType;

      const initialGain = this.calculateGain(i, 0);
      gainNode.gain.setValueAtTime(initialGain * this.volume, currentTime);

      oscillator.start();

      this.oscillators.push(oscillator);
      this.gainNodes.push(gainNode);
    }
  }

  protected calculateGain(oscillatorIndex: number, phase: number): number {
    const position = (oscillatorIndex - phase + this.numOscillators) % this.numOscillators;
    const center = (this.numOscillators - 1) / 2;
    const variance = 1.0;

    return Math.exp(-Math.pow(position - center, 2) / (2 * variance));
  }

  protected updateTone = (): void => {
    if (!this.isPlaying || !this.audioContext) return;

    const currentTime = this.audioContext.currentTime;
    const elapsed = currentTime - this.startTime;

    const phase = (elapsed % this.cycleDuration) / this.cycleDuration;

    this.oscillators.forEach((oscillator, index) => {
      if (!this.audioContext) return;

      const baseFreq = this.baseFrequency * Math.pow(2, index);
      const currentFreq = baseFreq * Math.pow(2, phase);

      oscillator.frequency.cancelScheduledValues(currentTime);
      oscillator.frequency.setValueAtTime(currentFreq, currentTime);

      const gain = this.calculateGain(index, phase * this.numOscillators);
      this.gainNodes[index].gain.cancelScheduledValues(currentTime);
      this.gainNodes[index].gain.setValueAtTime(gain * this.volume, currentTime);
    });

    this.animationFrameId = requestAnimationFrame(this.updateTone);
  };

  public dispose(): void {
    this.stop();
    this.oscillators = [];
    this.gainNodes = [];
    this.audioContext = null;
  }
}

interface AdvancedShepardToneConfig extends ShepardToneConfig {
  direction?: 'ascending' | 'descending';
}

class AdvancedShepardTone extends ShepardTone {
  private direction: 'ascending' | 'descending';

  constructor(config: AdvancedShepardToneConfig = {}) {
    super(config);
    this.direction = config.direction || 'ascending';
  }

  public setDirection(direction: 'ascending' | 'descending'): void {
    this.direction = direction;
  }

  public toggleDirection(): void {
    this.direction = this.direction === 'ascending' ? 'descending' : 'ascending';
  }

  public getDirection(): string {
    return this.direction;
  }

  protected updateTone = (): void => {
    if (!this.isPlaying || !this.audioContext) return;

    const currentTime = this.audioContext.currentTime;
    const elapsed = currentTime - this.startTime;

    let phase = (elapsed % this.cycleDuration) / this.cycleDuration;

    if (this.direction === 'descending') {
      phase = 1 - phase;
    }

    this.oscillators.forEach((oscillator, index) => {
      if (!this.audioContext) return;

      const baseFreq = this.baseFrequency * Math.pow(2, index);
      const currentFreq = this.direction === 'ascending'
        ? baseFreq * Math.pow(2, phase)
        : baseFreq / Math.pow(2, phase);

      oscillator.frequency.cancelScheduledValues(currentTime);
      oscillator.frequency.setValueAtTime(currentFreq, currentTime);

      const gain = this.calculateGain(index, phase * this.numOscillators);
      this.gainNodes[index].gain.cancelScheduledValues(currentTime);
      this.gainNodes[index].gain.setValueAtTime(gain * this.volume, currentTime);
    });

    this.animationFrameId = requestAnimationFrame(this.updateTone);
  };
}

export { ShepardTone, AdvancedShepardTone };
export type { OscillatorType, ShepardToneConfig, AdvancedShepardToneConfig };
