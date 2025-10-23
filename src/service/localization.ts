import { i18n, LANGUAGES, type TLanguage } from "~/i18n";
import { Injectable } from "~/utils/inject";

const isLanguage = (lang: string): lang is TLanguage => LANGUAGES.includes(lang as TLanguage)

@Injectable
export class Localization {
  private lang: TLanguage = 'en'
  private field: Record<string, HTMLElement[]> = {}

  constructor(lang?: string) {
    if (lang && isLanguage(lang)) this.lang = lang
  }

  public register = (key: string, element: HTMLElement) => {
    if (this.field[key]) {
      this.field[key].push(element)
    } else {
      this.field[key] = [element]
    }
    this.set(key)
  }

  public set language(lang: string) {
    const prev = this.lang
    if (isLanguage(lang)) this.lang = lang
    if (prev !== this.lang) this.emit()
  }

  public get language(): TLanguage {
    return this.lang
  }

  public get = (key: string) => {
    const text = i18n[this.lang][key] || ''
    if (!text) console.warn('No localization for', key)
    return text
  }

  private set = (key: string) => {
    const elements = this.field[key]
    const text = i18n[this.lang][key]
    if (elements && text) {
      elements.forEach(el => el.textContent = text)
    } else {
      if (!text) console.warn('No localization for', key)
      // if (!elements) console.warn('No elements for', key)
    }
  }

  private emit = () => {
    const loc = i18n[this.lang]
    for (const key of Object.keys(loc)) {
      this.set(key)
    }
  }
}
