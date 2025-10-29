interface SoundConfig {
  frequency: number;
  duration: number;
  volume: number;
  type: OscillatorType;
  fadeOut?: boolean;
}

export class SoundService {
  private audioContext: AudioContext;
  private sounds: Map<string, SoundConfig>;
  private masterGain: GainNode;

  constructor() {
    this.audioContext = new AudioContext();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);

    this.sounds = new Map([
      ['tap', { frequency: 200, duration: 0.1, volume: 0.3, type: 'sine' }],
      ['pum', { frequency: 600, duration: 0.3, volume: 0.4, type: 'sine', fadeOut: true }],
      ['ta', { frequency: 800, duration: 0.5, volume: 0.4, type: 'square', fadeOut: true }],
      ['block', { frequency: 150, duration: 0.2, volume: 0.4, type: 'sawtooth' }],
      ['tone-low', { frequency: 300, duration: 0.15, volume: 0.3, type: 'triangle' }],
      ['tone-high', { frequency: 400, duration: 0.05, volume: 0.2, type: 'square' }],
    ]);
  }

  public async play(soundName: string): Promise<void> {
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const config = this.sounds.get(soundName);
    if (!config) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.type = config.type;
    oscillator.frequency.value = config.frequency;
    gainNode.gain.value = config.volume;

    const now = this.audioContext.currentTime;

    if (config.fadeOut) {
      gainNode.gain.setValueAtTime(config.volume, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + config.duration);
    } else {
      gainNode.gain.setValueAtTime(config.volume, now);
      gainNode.gain.setValueAtTime(config.volume, now + config.duration - 0.01);
      gainNode.gain.linearRampToValueAtTime(0.001, now + config.duration);
    }

    oscillator.start(now);
    oscillator.stop(now + config.duration);
  }

  public set volume(volume: number) {
    this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
  }
}
