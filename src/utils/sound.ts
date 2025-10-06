type TSoundType = 'single' | 'multiple' | 'music'
type TSoundAssets = Record<string, { url: string, type: TSoundType }>
interface MusicObj extends HTMLAudioElement { musicInfo: { name: string, track: number } }

const sounds: TSoundAssets = {
  catch: { url: '/audio/catch.ogg', type: 'single' },
  combo: { url: '/audio/combo.ogg', type: 'single' },
  impact: { url: '/audio/impact.ogg', type: 'single' },
  jump: { url: '/audio/jump.ogg', type: 'single' },
}

const music = [
  {
    name: 'Mountains',
    url: '/audio/mountains.mp3',
  },
]

const countTotal = Object.keys(sounds).length + music.length * 2

export class Sound {
  static _instance: Sound
  private sound = { volume: 0.5, muted: false }
  private music = { volume: 0.25, muted: false }
  private sounds: Record<string, HTMLAudioElement[]> = {}
  private tracks: { name: string; audio: HTMLAudioElement; ready: boolean }[] = []
  private loaded = 0
  private ready = 0
  private pending = -1
  private playing: { track: number, audio: HTMLAudioElement } | null = null
  private startPlayCallback?: (_name?: string) => void
  private exceptionCallback?: (_message?: string) => void
  private readyCallback?: (_percent: number, _name: string) => void

  constructor() {
    if (Sound._instance) return Sound._instance
    Sound._instance = this
    Object.keys(sounds).forEach(name => {
      const { url, type } = sounds[name as keyof typeof sounds]
      this.getSound(url, name, type)
    })
    music.forEach(item => this.getSound(item.url, item.name, 'music'))

    this.handleCanplay = this.handleCanplay.bind(this)
    this.handleEnded = this.handleEnded.bind(this)

    // this.startPlayCallback = (name?: string) => console.log('Start play:', name)
    // this.exceptionCallback = (message?: string) => console.log('Error:', message)
    // this.readyCallback = (percent: number, name: string) => console.log(percent, name)
  }

  public set musicVolume(value: number) {
    this.music.volume = value
    if (this.playing) this.playing.audio.volume = value
  }

  public set musicMute(value: boolean) {
    this.music.muted = value
    if (this.playing) this.playing.audio.muted = value
    else this.play(0, true)
  }

  public play(track: number, loop: boolean) {
    if (this.music.muted || track === -1) return

    const music = this.tracks[track]
    if (!music || !music.ready) {
      console.log(`Pending music: ${track}. ${music ? music.name : ''}`)
      this.pending = track
      return
    }

    const audio = this.tracks[track].audio
    audio.volume = this.music.volume
    audio.muted = this.music.muted
    audio
      .play()
      .then(() => {
        if (loop) audio.addEventListener('ended', this.handleEnded)
        this.playing = { track, audio }
        if (this.startPlayCallback) {
          this.startPlayCallback(this.tracks[track].name)
        }
      })
      .catch(error => {
        if (error.name === 'NotAllowedError') {
          this.pending = track
          this.waitForUserInteraction().then(() => {
            this.play(this.pending, true);
          });
        } else {
          this.music.muted = true
          if (this.exceptionCallback) {
            this.exceptionCallback(error instanceof Error ? error.message : error.toString())
          }
        }
      })
  }

  public use(name: string) {
    if (this.sound.muted) return
    if (!Object.keys(sounds).includes(name)) {
      console.warn(`No sound: ${name}`)
      return
    }
    for (let i = 0; i < 10; i += 1) {
      const audio = this.sounds[name][i]
      if (audio.currentTime === 0 || audio.ended) {
        audio.volume = this.sound.volume
        audio.play().catch(error => console.error(error))
        return
      }
    }
  }

  private getSound(path: string, name: string, type?: string) {
    const self = this
    const requestObj = new Request(path, {
      method: 'GET',
      headers: {
        'Accept-Ranges': '1000000000',
      },
      referrerPolicy: 'no-referrer',
    })

    fetch(requestObj)
      .then(async function (outcome) {
        const blob = await outcome.blob()
        const url = window.URL.createObjectURL(blob)

        self.loaded += 1
        self.ready = ~~((self.loaded / countTotal) * 100)

        if (type === 'music') {
          const audio = new Audio() as MusicObj
          audio.src = url
          audio.musicInfo = { name, track: self.tracks.length }
          audio.addEventListener('canplay', self.handleCanplay)
          self.tracks.push({ name, audio, ready: false })
        } else {
          self.sounds[name] = Array.from({ length: type === 'multiple' ? 10 : 1 }, () => {
            const audio = new Audio()
            audio.src = url
            return audio
          })
        }

        if (self.readyCallback) {
          self.readyCallback(self.ready, name)
        }
      })
  }

  private handleCanplay(event: Event) {
    const target = event.target as MusicObj
    if (target) {
      target.removeEventListener('canplay', this.handleCanplay)
      const { name, track } = target.musicInfo
      this.loaded += 1
      this.ready = ~~((this.loaded / countTotal) * 100)
      this.tracks[track].ready = true
      console.log(`${track}. Can play '${name}'. Pending: ${this.pending}`)

      if (this.pending === track) {
        this.play(this.pending, true)
        this.pending = -1
      }
      if (this.readyCallback) {
        this.readyCallback(this.ready, name)
      }
    }
  }

  private handleEnded() {
    if (!this.playing) return
    let next = (this.playing.track ?? 0) + 1
    if (next >= this.tracks.length) next = 0
    this.playing = null
    this.play(next, true)
  }

  private waitForUserInteraction() {
    return new Promise<void>((resolve) => {
      const events = ['click', 'keydown', 'touchstart'];
      let resolved = false;

      const handler = () => {
        if (!resolved) {
          resolved = true;
          events.forEach(event => {
            document.removeEventListener(event, handler);
          });
          resolve();
        }
      };

      events.forEach(event => {
        document.addEventListener(event, handler, { passive: true });
      });
    });
  }
}
