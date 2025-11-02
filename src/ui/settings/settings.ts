import { Storage } from '~/service/storage'
import { Audio } from '~/service/audio'
import { ShepardTone } from '~/service/shepardTone'
import { SoundService } from '~/service/sound'
import { iconSrc } from '~/ui/icons'
import { LANGUAGES, type TLanguage } from '~/i18n'
import { Localization } from '~/service/localization'
import { GamepadService } from '~/service/gamepad'
import { Injectable, inject } from '~/utils/inject'
import { buttonClose } from '~/ui/button'
import type { EngineSettings } from '~/engine/types'

import styles from './settings.module.css'
import modal from '~/ui/modal.module.css'
import layer from '~/ui/layers.module.css'

type TOption = 'music' | 'sound' | 'fps' | 'language'
const OPTIONS: TOption[] = ['music', 'sound', 'fps', 'language']

class SettingsView {
  protected loc: Localization
  protected container: HTMLDivElement
  protected inner: HTMLDivElement
  protected close: HTMLDivElement
  protected isActive = false

  constructor() {
    this.loc = inject(Localization)

    this.container = document.createElement('div')
    this.container.classList.add(layer.settings, modal.outer)
    this.container.setAttribute('style', 'display: none;')

    const header = document.createElement('h3')
    this.loc.register('settings', header)
    this.inner = document.createElement('div')
    this.inner.className = modal.inner
    this.close = buttonClose()
    this.inner.append(header, this.close)
    this.container.append(this.inner)
  }

  public show = (state = true) => {
    if (state) {
      this.container.removeAttribute('style')
    } else {
      this.container.setAttribute('style', 'display: none')
    }
    this.inner.classList.toggle(modal.bounce, state)
    this.isActive = state
  }

  public get element() {
    return this.container
  }
}

@Injectable
export class SettingsUI extends SettingsView {
  private storage: Storage
  private audio: Audio
  private tone: ShepardTone
  private soundService: SoundService
  private list: HTMLUListElement
  private opt: Record<string, { element: HTMLLIElement, label: HTMLLabelElement, icon: HTMLImageElement, input: HTMLInputElement }> = {}
  private flags: HTMLDivElement
  private gamepadService: GamepadService
  private selectedOptionIndex = 0
  private selectedOptionId: TOption = 'music'
  private onClose?: () => void
  private engineSettings?: EngineSettings["set"]

  constructor() {
    super()
    this.gamepadService = inject(GamepadService)
    this.storage = inject(Storage)
    this.audio = inject(Audio)
    this.tone = inject(ShepardTone)
    this.soundService = inject(SoundService)

    this.list = document.createElement('ul')
    this.list.className = styles.list

    OPTIONS.forEach((id, index) => {
      this.opt[id] = {
        element: document.createElement('li'),
        label: document.createElement('label'),
        input: document.createElement('input'),
        icon: document.createElement('img')
      }

      const paw = document.createElement('img')
      paw.src = iconSrc.paw
      paw.className = styles.paw

      this.opt[id].label.append(paw, this.opt[id].icon, this.opt[id].input)
      this.opt[id].element.append(this.opt[id].label)

      this.opt[id].element.addEventListener('mouseenter', () => {
        this.selectedOptionIndex = index
        this.handleOptionSelect()
      })
    })

    const musicVolume = Math.max(0, Math.min(this.storage.get<number>('music'), 1))
    this.opt.music.element.className = styles.list__element
    this.opt.music.label.setAttribute('label-for', 'music')
    Object.assign(this.opt.music.input, {
      id: 'music',
      type: 'range',
      min: '0',
      max: '1',
      step: '0.1',
      defaultValue: musicVolume.toString(),
      // onchange: (event: Event) => console.log((event.currentTarget as HTMLInputElement).value),
    });
    this.opt.music.icon.src = iconSrc.music
    this.opt.music.input.addEventListener('change', event => {
      const value = Number((event.currentTarget as HTMLInputElement)?.value)
      if (isFinite(value)) this.handleMusicVolumeChange(value)
    })

    const soundVolume = Math.max(0, Math.min(this.storage.get<number>('sound'), 1))
    this.opt.sound.element.className = styles.list__element
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
      if (isFinite(value)) this.handleSoundVolumeChange(value)
    })

    const fpsChecked = this.storage.get<boolean>('fps')
    this.opt.fps.element.className = styles.list__element
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
      this.handleFpsCheckedChange(checked)
    })

    const language = this.storage.get<string>('language')
    this.opt.language.element.className = styles.list__element
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
      flag.addEventListener('pointerdown', this.handleLanguageSelect(lang))
    }
    this.opt.language.label.append(this.flags)

    this.list.append(...Object.values(this.opt).map(opt => opt.element))
    const dummy = document.createElement('div')
    dummy.className = modal.dummy
    this.inner.append(this.list, dummy)

    this.gamepadService.registerCallbacks({ onButtonUp: this.onGamepadButtonUp })

    this.handleOptionSelect()
    this.registerEvents()
  }

  public registerCallback = (callbacks: { onClose?: () => void, engineSettings?: EngineSettings["set"] }) => {
    if (callbacks.onClose) this.onClose = callbacks.onClose
    if (callbacks.engineSettings) this.engineSettings = callbacks.engineSettings
  }

  private registerEvents = () => {
    const handleOutsideClick = (event: PointerEvent) => {
      const { target, currentTarget } = event;
      if (currentTarget && target === currentTarget) {
        const element = currentTarget as HTMLDivElement
        element.setAttribute('style', 'display: none;')
        for (const child of element.children) {
          child.classList.remove(modal.bounce)
        }
        if (this.onClose) this.onClose()
      }
    }

    this.container.addEventListener('click', handleOutsideClick)
    this.close.addEventListener('click', () => {
      this.show(false)
      if (this.onClose) this.onClose()
    })
  }

  private onGamepadButtonUp = (_gamepadIndex: number, buttonIndex: number) => {
    if (!this.isActive) return

    if (buttonIndex === 0) {
      this.show(false)
      if (this.onClose) this.onClose()
    }

    if (buttonIndex === 12 || buttonIndex === 13) {
      if (buttonIndex === 12) { // up
        this.selectedOptionIndex = this.selectedOptionIndex > 0 ? this.selectedOptionIndex - 1 : 0
      }
      if (buttonIndex === 13) { // down
        this.selectedOptionIndex = this.selectedOptionIndex < OPTIONS.length - 1 ? this.selectedOptionIndex + 1 : OPTIONS.length - 1
      }
      this.handleOptionSelect()
    }

    if (buttonIndex === 14 || buttonIndex === 15) {
      if (buttonIndex === 14) { // left
        this.handleChange(-1)
      }
      if (buttonIndex === 15) { // right
        this.handleChange(1)
      }
    }
  }

  private handleOptionSelect = () => {
    OPTIONS.forEach((key, i) => {
      const item = this.opt[key]
      item.element.classList.toggle(styles.hover, i === this.selectedOptionIndex)
      if (i === this.selectedOptionIndex) {
        this.selectedOptionId = key
      }
    })
  }

  private handleChange = (delta: number) => {
    switch (this.selectedOptionId) {
      case ('music'): {
        let value = Number(this.opt.music.input.value)
        if (isFinite(value)) {
          value = Math.min(Math.max(value + delta * .1, 0), 1)
          this.handleMusicVolumeChange(value)
        }
        break
      }
      case ('sound'): {
        let value = Number(this.opt.sound.input.value)
        if (isFinite(value)) {
          value = Math.min(Math.max(value + delta * .1, 0), 1)
          this.handleSoundVolumeChange(value)
        }
        break
      }
      case ('language'): {
        const value = this.opt.language.input.value as TLanguage
        let index = LANGUAGES.indexOf(value)
        if (index != -1) {
          index = Math.min(Math.max(index + delta, 0), LANGUAGES.length - 1)
          this.handleLanguageSelect(LANGUAGES[index])()
        }
        break
      }
      case ('fps'): {
        const checked = this.opt.fps.input.checked
        this.handleFpsCheckedChange(!checked)
        break
      }
      default: {
        console.log(this.selectedOptionId)
      }
    }
  }

  private handleMusicVolumeChange = (value: number) => {
    value = Math.round(value * 10) / 10
    this.storage.set('music', value)
    this.audio.musicVolume = value
    this.audio.play(0)
    this.opt.music.input.value = value.toString()
  }

  private handleSoundVolumeChange = (value: number) => {
    value = Math.round(value * 10) / 10
    this.storage.set('sound', value)
    this.audio.soundVolume = value
    this.tone.volume = value
    this.soundService.volume = value
    this.opt.sound.input.value = value.toString()

    this.soundService.play('tone-high')
  }

  private handleFpsCheckedChange = (checked: boolean) => {
    this.storage.set('fps', checked)
    this.opt.fps.input.checked = checked
    if (this.engineSettings) {
      this.engineSettings({ fps: checked })
    }
  }

  public setLanguage = (lang: string) => {
    if (!LANGUAGES.includes(lang as TLanguage)) return
    this.loc.language = lang
    this.opt.language.input.value = lang
    const list = this.flags.children
    for (const flag of list) {
      flag.classList.toggle(styles.selected, (flag as HTMLImageElement).alt === lang)
    }
  }

  private handleLanguageSelect = (lang: string) => () => {
    this.storage.set('language', lang)
    this.setLanguage(lang)
  }
}
