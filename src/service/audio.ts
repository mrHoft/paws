import { Injectable } from "~/utils/inject"

type TAudioType = 'sound' | 'music'
type TSoundAssets = Record<string, { url: string, type: TAudioType }>

const sounds: TSoundAssets = {
  catch: { url: './audio/catch.ogg', type: 'sound' },
  combo: { url: './audio/combo.ogg', type: 'sound' },
  impact: { url: './audio/impact.ogg', type: 'sound' },
  jump: { url: './audio/jump.ogg', type: 'sound' },
}

const tracks = [
  {
    name: 'Mountains',
    url: './audio/mountains.mp3',
  },
]

const countTotal = Object.keys(sounds).length + tracks.length * 2

interface SoundBufferInfo {
  buffer: AudioBuffer;
  name: string;
  type: TAudioType;
}

interface MusicTrack {
  name: string;
  buffer: AudioBuffer;
  ready: boolean;
  track: number;
}

@Injectable
export class AudioService {
  private _sound = { volume: 0.5, muted: false }
  private _music = { volume: 0.5, muted: true }
  private audioContext!: AudioContext
  private soundBuffers: Record<string, SoundBufferInfo> = {}
  private tracks: MusicTrack[] = []
  private loaded = 0
  private ready = 0
  private pending = -1
  private playing: { track: number, source: AudioBufferSourceNode, gainNode: GainNode } | null = null
  private startPlayCallback?: (_name?: string) => void
  private exceptionCallback?: (_message?: string) => void
  private readyCallback?: (_percent: number, _name: string) => void
  private masterGain!: GainNode
  private musicGain!: GainNode
  private soundGain!: GainNode

  constructor(props: { sound?: { volume: number, muted: boolean }, music?: { volume: number, muted: boolean } } = {}) {
    if (props.sound) this._sound = props.sound
    if (props.music) this._music = props.music
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    this.masterGain = this.audioContext.createGain()
    this.musicGain = this.audioContext.createGain()
    this.soundGain = this.audioContext.createGain()
    this.soundGain.connect(this.masterGain)
    this.musicGain.connect(this.masterGain)
    this.masterGain.connect(this.audioContext.destination)

    this.updateVolumes()

    Object.keys(sounds).forEach(name => {
      const { url, type } = sounds[name as keyof typeof sounds]
      this.loadSound(url, name, type)
    })
    tracks.forEach(item => this.loadSound(item.url, item.name, 'music'))

    this.handleEnded = this.handleEnded.bind(this)

    // this.startPlayCallback = (name?: string) => console.log('Start play:', name)
    // this.exceptionCallback = (message?: string) => console.log('Error:', message)
    // this.readyCallback = (percent: number, name: string) => console.log(percent, name)
  }

  private updateVolumes() {
    this.musicGain.gain.value = this._music.muted ? 0 : this._music.volume
    this.soundGain.gain.value = this._sound.muted ? 0 : this._sound.volume
  }

  public set musicVolume(value: number) {
    this._music.volume = value
    this._music.muted = value === 0
    this.updateVolumes()
  }

  public set musicMute(value: boolean) {
    this._music.muted = value
    this.updateVolumes()
  }

  public set mute(value: boolean) {
    this._sound.muted = value
    this.musicMute = value
  }

  public get muted() {
    return this._sound.muted || this._music.muted
  }

  public get music() {
    return this._music
  }

  public get sound() {
    return this._sound
  }

  public set soundVolume(value: number) {
    this._sound.muted = value === 0
    this._sound.volume = value
    this.updateVolumes()
  }

  public play(track: number, auto?: boolean) {
    if (this._music.muted || track === -1) return

    const music = this.tracks[track]
    if (!music || !music.ready) {
      this.pending = track
      return
    }

    if (this.playing) {
      this.playing.source.onended = null
      this.playing.source.stop()
      this.playing.source.disconnect()
      this.playing = null
    }

    try {
      const source = this.audioContext.createBufferSource()
      const gainNode = this.audioContext.createGain()

      source.buffer = music.buffer
      source.connect(gainNode)
      gainNode.connect(this.musicGain)
      gainNode.gain.value = this._music.muted ? 0 : this._music.volume

      source.onended = this.handleEnded(auto)
      source.start(0)

      this.playing = { track, source, gainNode }

      if (this.startPlayCallback) {
        this.startPlayCallback(music.name)
      }
    } catch (error) {
      if (this.exceptionCallback) {
        this.exceptionCallback(error instanceof Error ? error.message : String(error))
      }
    }
  }

  public pause = () => {
    if (this.playing) {
      this.playing.source.stop()
      this.playing.source.disconnect()
      this.playing = null
    }
  }

  public use(name: string) {
    if (this._sound.muted) return
    if (!this.soundBuffers[name]) {
      console.warn(`No sound: ${name}`)
      return
    }

    const soundInfo = this.soundBuffers[name]
    if (!soundInfo.buffer) return

    try {
      const source = this.audioContext.createBufferSource()
      const gainNode = this.audioContext.createGain()

      source.buffer = soundInfo.buffer
      source.connect(gainNode)
      gainNode.connect(this.soundGain)
      gainNode.gain.value = this._sound.muted ? 0 : this._sound.volume

      source.start(0)

      source.onended = () => {
        source.disconnect()
        gainNode.disconnect()
      }
    } catch (error) {
      console.error('Error playing sound:', error)
    }
  }

  private async loadSound(path: string, name: string, type?: TAudioType) {
    try {
      const response = await fetch(path)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)

      this.loaded += 1
      this.ready = ~~((this.loaded / countTotal) * 100)

      if (type === 'music') {
        this.tracks.push({
          name,
          buffer: audioBuffer,
          ready: true,
          track: this.tracks.length
        })

        this.loaded += 1
        this.ready = ~~((this.loaded / countTotal) * 100)

        if (this.pending === this.tracks.length - 1) {
          this.play(this.pending, true)
          this.pending = -1
        }
      } else {
        this.soundBuffers[name] = {
          buffer: audioBuffer,
          name,
          type: type || 'sound'
        }
      }

      if (this.readyCallback) {
        this.readyCallback(this.ready, name)
      }
    } catch (error) {
      console.error(`Error loading sound ${name}:`, error)
      if (this.exceptionCallback) {
        this.exceptionCallback(`Failed to load sound: ${name}`)
      }
    }
  }

  private handleEnded(auto?: boolean) {
    return () => {
      if (!this.playing) return
      let next = (this.playing.track ?? 0) + 1
      if (next >= this.tracks.length) next = 0

      if (auto) {
        this.play(next, true)
      } else {
        this.playing = null
      }
    }
  }

  public destroy() {
    if (this.playing) {
      this.playing.source.stop()
      this.playing.source.disconnect()
    }
    this.audioContext.close()
  }
}
