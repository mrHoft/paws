import { Injectable } from "~/utils/inject"

const sounds: Record<string, { url: string }> = {
  catch: { url: './audio/catch.ogg' },
  combo: { url: './audio/combo.ogg' },
  impact: { url: './audio/impact.ogg' },
  jump: { url: './audio/jump.ogg' },
}

const tracks = [
  {
    name: 'autumn',
    url: './audio/adventure-143065.mp3',
  },
  {
    name: 'cliff',
    url: './audio/adventure-271551.mp3',
  },
  {
    name: 'desert',
    url: './audio/adventure-457971.mp3',
  },
  {
    name: 'forest',
    url: './audio/adventure-511429.mp3',
  },
  {
    name: 'jungle',
    url: './audio/adventure-186924.mp3',
  },
  {
    name: 'lake',
    url: './audio/adventure-402992.mp3',
  },
  {
    name: 'mountains',
    url: './audio/adventure-506053.mp3',
  },
]

const soundsTotal = Object.keys(sounds).length

interface SoundTrack {
  buffer: AudioBuffer;
  name: string;
}

interface MusicTrack {
  buffer: AudioBuffer;
  name: string;
  ready: boolean;
  track: number;
}

@Injectable
export class AudioService {
  private _sound = { volume: 0.5, muted: false }
  private _music = { volume: 0.5, muted: true }
  private audioContext!: AudioContext
  private sounds: Record<string, SoundTrack> = {}
  private tracks: (MusicTrack | null)[] = Array.from({ length: tracks.length }, () => null)
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
      this.loadSound(name)
    })

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

  public play(track: number, auto = true) {
    if (this._music.muted || track === -1 || track >= tracks.length) return

    const music = this.tracks[track]
    if (!music) {
      this.pending = track
      this.loadMusic(track)
      return
    } else if (!music.ready) {
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

      source.onended = () => this.handleEnded(auto)
      source.start(0)

      this.playing = { track, source, gainNode }

      this.startPlayCallback?.(music.name)
    } catch (error) {
      this.exceptionCallback?.(error instanceof Error ? error.message : String(error))
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
    if (!this.sounds[name]) {
      console.warn(`No sound: ${name}`)
      return
    }

    const soundInfo = this.sounds[name]
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

  private async loadSound(name: string) {
    const { url } = sounds[name as keyof typeof sounds] || {}
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw Error(`HTTP error! status: ${response.status}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)

      this.sounds[name] = {
        buffer: audioBuffer,
        name,
      }


      this.loaded += 1
      this.ready = ~~((this.loaded / soundsTotal) * 100)
      this.readyCallback?.(this.ready, name)
    } catch (error) {
      console.error(`Error loading sound ${name}:`, error instanceof Error ? error.message : error)
      this.exceptionCallback?.(`Failed to load sound: ${name}`)
    }
  }

  private async loadMusic(track: number) {
    const { url, name } = tracks[track] || {}
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw Error(`HTTP error! status: ${response.status}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)

      this.tracks[track] = {
        name,
        buffer: audioBuffer,
        ready: true,
        track: this.tracks.length
      }

      if (~this.pending) {
        this.play(this.pending)
        this.pending = -1
      }
    } catch (error) {
      console.error(`Error loading music ${name}:`, error instanceof Error ? error.message : error)
      this.exceptionCallback?.(`Failed to load music: ${name}`)
    }
  }

  private handleEnded(auto: boolean, loop = true) {
    if (!this.playing) return

    if (loop) {
      this.play(this.playing.track)
      return
    }

    if (auto) {
      const next = ((this.playing.track ?? 0) + 1) % (this.tracks.length - 1)
      this.play(next, true)
    } else {
      this.playing = null
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
