import { iconSrc } from '~/ui/icons'

import styles from './settings.module.css'

type TOption = 'music' | 'sound' | 'fps' | 'language'
const OPTIONS: TOption[] = ['music', 'sound', 'fps', 'language']
const LANGUAGES = ['en', 'ru', 'tr', 'de']

export class Settings {
  private container: HTMLUListElement
  private opt: Record<string, { el: HTMLLIElement, label: HTMLLabelElement, icon: HTMLImageElement, input: HTMLInputElement }> = {}
  private flags: HTMLDivElement

  constructor() {
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

    this.opt.music.el.className = styles.list__element
    this.opt.music.label.setAttribute('label-for', 'music')
    Object.assign(this.opt.music.input, {
      id: 'music',
      type: 'range',
      min: '0',
      max: '1',
      step: '0.1',
      defaultValue: '0.5',
      onchange: (event: Event) => console.log((event.currentTarget as HTMLInputElement).value)
    });
    this.opt.music.icon.src = iconSrc.music

    this.opt.sound.el.className = styles.list__element
    this.opt.sound.label.setAttribute('label-for', 'sound')
    Object.assign(this.opt.sound.input, {
      id: 'sound',
      type: 'range',
      min: '0',
      max: '1',
      step: '0.1',
      defaultValue: '0.5',
      onchange: (event: Event) => console.log((event.currentTarget as HTMLInputElement).value)
    })
    this.opt.sound.icon.src = iconSrc.sound

    this.opt.fps.el.className = styles.list__element
    this.opt.fps.label.setAttribute('label-for', 'fps')
    Object.assign(this.opt.fps.input, {
      id: 'fps',
      type: 'checkbox',
      defaultChecked: true,
      onchange: (event: Event) => console.log((event.currentTarget as HTMLInputElement).value),
    })
    this.opt.fps.icon.src = iconSrc.fps


    this.opt.language.el.className = styles.list__element
    this.opt.fps.label.setAttribute('label-for', 'language')
    this.opt.language.icon.src = iconSrc.globe
    this.opt.sound.label.setAttribute('label-for', 'language')
    this.opt.language.input.setAttribute('style', 'display: none;')
    Object.assign(this.opt.language.input, {
      id: 'language',
      defaultValue: 'en',
      style: 'display: none;',
      onchange: (event: Event) => console.log((event.currentTarget as HTMLInputElement).value),
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
    console.log(lang)
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
