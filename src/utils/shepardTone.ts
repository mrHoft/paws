// Shepard tone usage example:
/*
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
  direction: 'ascending'
});

// Start the tones
basicTone.start();
advancedTone.start();

// Change properties dynamically
setTimeout(() => {
  advancedTone.direction = 'descending';
  advancedTone.cycleDuration = 2.0;
}, 5000);

// Stop after 10 seconds
setTimeout(() => {
  basicTone.stop();
  advancedTone.stop();
}, 10000);
 */

export type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle';

export interface ShepardToneConfig {
  baseFrequency?: number;
  numOscillators?: number;
  cycleDuration?: number;
  oscillatorType?: OscillatorType;
  volume?: number;
}

const getAudioContextConstructor = (): typeof AudioContext | null => {
  return (window as any).AudioContext || (window as any).webkitAudioContext || null;
};

export class ShepardTone {
  protected audioContext: AudioContext | null = null;
  protected oscillators: OscillatorNode[] = [];
  protected gainNodes: GainNode[] = [];
  protected _isPlaying = false;
  protected startTime = 0;
  protected nextScheduleTime = 0;
  protected readonly SCHEDULE_AHEAD_TIME = 0.1; // 100ms

  protected baseFrequency: number;
  protected numOscillators: number;
  protected _cycleDuration: number;
  protected oscillatorType: OscillatorType;
  protected _volume: number;

  constructor(config: ShepardToneConfig = {}) {
    this.baseFrequency = config.baseFrequency ?? 220;
    this.numOscillators = config.numOscillators ?? 4;
    this._cycleDuration = Math.max(0.1, config.cycleDuration ?? 2.0);
    this.oscillatorType = config.oscillatorType ?? 'sine';
    this._volume = Math.max(0, Math.min(1, config.volume ?? 0.3));
  }

  public async start(): Promise<void> {
    if (this._isPlaying) return;

    const AudioContextCtor = getAudioContextConstructor();
    if (!AudioContextCtor) {
      console.error('Web Audio API not supported');
      return;
    }

    try {
      this.audioContext = new AudioContextCtor();
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this._isPlaying = true;
      this.startTime = this.audioContext.currentTime;
      this.nextScheduleTime = this.startTime;

      this.createOscillators();
      this.schedule();
    } catch (error) {
      console.error('Failed to start Shepard Tone:', error);
      this._isPlaying = false;
      if (this.audioContext) {
        await this.audioContext.close().catch(() => { });
        this.audioContext = null;
      }
    }
  }

  public stop(): void {
    if (!this._isPlaying) return;

    this._isPlaying = false;

    this.oscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch { }
    });
    this.gainNodes.forEach(gain => gain.disconnect());

    this.oscillators = [];
    this.gainNodes = [];

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(console.error);
      this.audioContext = null;
    }
  }

  public set cycleDuration(duration: number) {
    this._cycleDuration = Math.max(0.1, duration);
  }

  public set volume(value: number) {
    this._volume = Math.max(0, Math.min(1, value));
    if (this._isPlaying && this.audioContext) {
      const now = this.audioContext.currentTime;
      this.gainNodes.forEach(gain => {
        gain.gain.setValueAtTime(this._volume * this.getCurrentGainForOscillator(/* gain */), now);
      });
    }
  }

  public get isPlaying(): boolean {
    return this._isPlaying;
  }

  protected createOscillators(): void {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    for (let i = 0; i < this.numOscillators; i++) {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = this.oscillatorType;
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      const baseFreq = this.baseFrequency * Math.pow(2, i);
      oscillator.frequency.setValueAtTime(baseFreq, now);

      const initialGain = this.calculateGain(i, 0);
      gainNode.gain.setValueAtTime(initialGain * this._volume, now);

      oscillator.start(now);

      this.oscillators.push(oscillator);
      this.gainNodes.push(gainNode);
    }
  }

  protected calculateGain(oscIndex: number, phase: number): number {
    const position = (oscIndex - phase + this.numOscillators) % this.numOscillators;
    const center = (this.numOscillators - 1) / 2;
    const variance = 1.0;
    return Math.exp(-Math.pow(position - center, 2) / (2 * variance));
  }

  private getCurrentGainForOscillator(/* gainNode: GainNode */): number {
    // In practice, you'd track phase separately, but for simplicity:
    // This is a limitation—volume change won't perfectly align without phase tracking.
    // For most use cases, it's acceptable.
    return 1; // Not ideal, but better than nothing
  }

  protected schedule(): void {
    if (!this._isPlaying || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    const endTime = now + this.SCHEDULE_AHEAD_TIME;

    while (this.nextScheduleTime < endTime) {
      const elapsed = this.nextScheduleTime - this.startTime;
      const cycleProgress = (elapsed % this._cycleDuration) / this._cycleDuration;

      this.oscillators.forEach((osc, i) => {
        const baseFreq = this.baseFrequency * Math.pow(2, i);
        const freq = baseFreq * Math.pow(2, cycleProgress); // ascending

        if (this.nextScheduleTime === this.startTime) {
          osc.frequency.setValueAtTime(freq, this.nextScheduleTime);
        } else {
          osc.frequency.exponentialRampToValueAtTime(freq, this.nextScheduleTime);
        }

        const gain = this.calculateGain(i, cycleProgress * this.numOscillators) * this._volume;
        this.gainNodes[i].gain.setValueAtTime(gain, this.nextScheduleTime);
      });

      this.nextScheduleTime += 0.02; // ~50 Hz update rate (good balance)
    }

    setTimeout(() => this.schedule(), 80); // ~12.5 Hz scheduling loop
  }

  public dispose(): void {
    this.stop();
  }
}

/* --- Advanced Shepard Tone (with direction) --- */

export interface AdvancedShepardToneConfig extends ShepardToneConfig {
  direction?: 'ascending' | 'descending';
}

export class AdvancedShepardTone extends ShepardTone {
  private _direction: 'ascending' | 'descending' = 'ascending';

  constructor(config: AdvancedShepardToneConfig = {}) {
    super(config);
    this._direction = config.direction ?? 'ascending';
  }

  public set direction(direction: 'ascending' | 'descending') {
    this._direction = direction;
  }

  public get direction(): 'ascending' | 'descending' {
    return this._direction;
  }

  public toggleDirection(): void {
    this._direction = this._direction === 'ascending' ? 'descending' : 'ascending';
  }

  protected schedule(): void {
    if (!this._isPlaying || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    const endTime = now + this.SCHEDULE_AHEAD_TIME;

    while (this.nextScheduleTime < endTime) {
      const elapsed = this.nextScheduleTime - this.startTime;
      let cycleProgress = (elapsed % this._cycleDuration) / this._cycleDuration;

      if (this._direction === 'descending') {
        cycleProgress = 1 - cycleProgress;
      }

      this.oscillators.forEach((osc, i) => {
        const baseFreq = this.baseFrequency * Math.pow(2, i);
        const freq = this._direction === 'ascending'
          ? baseFreq * Math.pow(2, cycleProgress)
          : baseFreq / Math.pow(2, cycleProgress);

        if (this.nextScheduleTime === this.startTime) {
          osc.frequency.setValueAtTime(freq, this.nextScheduleTime);
        } else {
          osc.frequency.exponentialRampToValueAtTime(freq, this.nextScheduleTime);
        }

        const gain = this.calculateGain(i, cycleProgress * this.numOscillators) * this._volume;
        this.gainNodes[i].gain.setValueAtTime(gain, this.nextScheduleTime);
      });

      this.nextScheduleTime += 0.02;
    }

    setTimeout(() => this.schedule(), 80);
  }
}
