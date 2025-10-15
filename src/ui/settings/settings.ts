import { Storage } from '~/service/storage'
import { Sound } from '~/service/sound'
import { iconSrc } from '~/ui/icons'
import { LANGUAGES } from '~/i18n'
import { Localization } from '~/service/localization'

import styles from './settings.module.css'

type TOption = 'music' | 'sound' | 'fps' | 'language'
const OPTIONS: TOption[] = ['music', 'sound', 'fps', 'language']

export class Settings {
  private storage: Storage
  private sound: Sound
  private loc: Localization
  private container: HTMLUListElement
  private opt: Record<string, { el: HTMLLIElement, label: HTMLLabelElement, icon: HTMLImageElement, input: HTMLInputElement }> = {}
  private flags: HTMLDivElement

  constructor() {
    this.storage = new Storage()
    this.sound = new Sound()
    this.loc = new Localization()
    this.container = document.createElement('ul')
    this.container.className = styles.list

    for (const el of OPTIONS) {
      this.opt[el] = {
        el: document.createElement('li'),
        label: document.createElement('label'),
        input: document.createElement('input'),
        icon: document.createElement('img')
      }
      this.opt[el].label.append(this.opt[el].icon, this.opt[el].input)
      this.opt[el].el.append(this.opt[el].label)
    }

    const musicVolume = Math.max(0, Math.min(this.storage.get<number>('music'), 1))
    this.opt.music.el.className = styles.list__element
    this.opt.music.label.setAttribute('label-for', 'music')
    Object.assign(this.opt.music.input, {
      id: 'music',
      type: 'range',
      min: '0',
      max: '1',
      step: '0.1',
      defaultValue: musicVolume.toString(),
      // onchange: (event: Event) => console.log((event.currentTarget as HTMLInputElement).value)
    });
    this.opt.music.icon.src = iconSrc.music
    this.opt.music.input.addEventListener('change', event => {
      const value = Number((event.currentTarget as HTMLInputElement)?.value)
      if (isFinite(value)) {
        this.storage.set('music', value)
        this.sound.musicVolume = value
        this.sound.play(0)
      }
    })

    const soundVolume = Math.max(0, Math.min(this.storage.get<number>('sound'), 1))
    this.opt.sound.el.className = styles.list__element
    this.opt.sound.label.setAttribute('label-for', 'sound')
    Object.assign(this.opt.sound.input, {
      id: 'sound',
      type: 'range',
      min: '0',
      max: '1',
      step: '0.1',
      defaultValue: soundVolume.toString(),
      // onchange: (event: Event) => console.log((event.currentTarget as HTMLInputElement).value)
    })
    this.opt.sound.icon.src = iconSrc.sound
    this.opt.sound.input.addEventListener('change', event => {
      const value = Number((event.currentTarget as HTMLInputElement)?.value)
      if (isFinite(value)) {
        this.storage.set('sound', value)
        this.sound.soundVolume = value
        this.sound.use('catch')
      }
    })

    const fpsChecked = this.storage.get<boolean>('fps')
    this.opt.fps.el.className = styles.list__element
    this.opt.fps.label.setAttribute('label-for', 'fps')
    Object.assign(this.opt.fps.input, {
      id: 'fps',
      type: 'checkbox',
      defaultChecked: fpsChecked,
      // onchange: (event: Event) => console.log((event.currentTarget as HTMLInputElement).value),
    })
    this.opt.fps.icon.src = iconSrc.fps
    this.opt.fps.input.addEventListener('change', event => {
      const { checked } = (event.currentTarget as HTMLInputElement)
      this.storage.set('fps', checked)
    })

    const language = this.storage.get<string>('language')
    this.opt.language.el.className = styles.list__element
    this.opt.fps.label.setAttribute('label-for', 'language')
    this.opt.language.icon.src = iconSrc.globe
    this.opt.sound.label.setAttribute('label-for', 'language')
    this.opt.language.input.setAttribute('style', 'display: none;')
    Object.assign(this.opt.language.input, {
      id: 'language',
      defaultValue: language,
      style: 'display: none;',
      // onchange: (event: Event) => console.log((event.currentTarget as HTMLInputElement).value),
    })

    this.flags = document.createElement('div')
    this.flags.className = styles.flag_list
    for (const lang of LANGUAGES) {
      const flag = document.createElement('img')
      flag.className = styles.flag
      flag.src = iconSrc[lang]
      flag.alt = lang
      if (lang === this.opt.language.input.value) {
        flag.classList.toggle(styles.selected, true)
      }
      this.flags.append(flag)
      flag.addEventListener('pointerdown', this.handleFlagClick(lang))
    }
    this.opt.language.label.append(this.flags)

    this.container.append(...Object.values(this.opt).map(opt => opt.el))
  }

  private handleFlagClick = (lang: string) => () => {
    // console.log(lang)
    this.storage.set('language', lang)
    this.loc.language = lang
    this.opt.language.input.value = lang
    const list = this.flags.children
    for (const flag of list) {
      flag.classList.toggle(styles.selected, (flag as HTMLImageElement).alt === lang)
    }
  }

  public get element() {
    return this.container
  }
}
