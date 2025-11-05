import { spoilSrc } from "~/ui/icons";
import { Storage } from '~/service/storage'
import { Injectable, inject } from "~/utils/inject";
import { caughtNameTransform } from "~/utils/caught";

import styles from './caught.module.css'

const slots = ['butterfly', 'mouse', 'bird', 'frog', 'star']

@Injectable
export class Caught {
  private storage!: Storage
  private container!: HTMLDivElement
  private count: Record<string, number> = {
    butterfly: 0,
    frog: 0,
    mouse: 0,
    bird: 0,
    star: 0,
  }
  private slot: Record<string, { icon: HTMLImageElement, value: HTMLSpanElement }> = {}

  constructor() {
    this.storage = inject(Storage)
    const initialCaught = this.storage.get<Record<string, number>>('data.caught')
    const initialStars = this.storage.get<number>('data.stars')
    if (initialCaught) this.count = { ...this.count, ...initialCaught, star: initialStars || 0 }

    this.container = document.createElement('div')
    this.container.className = styles.caught
    for (const name of slots) {
      const { slot, icon, value } = this.createSlot(name)
      this.slot[name] = { icon, value }
      this.container.append(slot)
    }
  }

  public setCount(value: Record<string, number>) {
    for (const key of Object.keys(this.slot)) {
      if (value[key] !== undefined) {
        if (this.count[key] !== value[key]) {
          this.count[key] = value[key]
          this.slot[key]!.value.innerText = value[key].toString()
          this.bounce(this.slot[key].icon)
        }
      }
    }
  }

  public handleUpdate = (name: string) => {
    const key = caughtNameTransform(name)
    if (slots.includes(key)) {
      this.count[key] += 1
      this.slot[key]!.value.innerText = this.count[key].toString()
      if (name === 'star') {
        this.storage.set('data.stars', this.count[key])
      } else {
        this.storage.set(`data.caught.${key}`, this.count[key])
      }

      this.bounce(this.slot[key].icon)
    }
  }

  public handleReset = () => {
    for (const name of slots) {
      this.count[name] = 0
      this.slot[name]!.value.innerText = '0'
    }
    this.storage.set(`data.caught`, this.count)
  }

  private createSlot = (name: string) => {
    const slot = document.createDocumentFragment()
    const spoil = document.createElement('span')
    spoil.className = styles.spoil
    const icon = document.createElement('img')
    icon.src = spoilSrc[name]
    icon.alt = name
    icon.setAttribute('draggable', 'false')
    spoil.append(icon)
    const value = document.createElement('span')
    value.innerText = this.count[name].toString()
    // value.setAttribute('style', 'vertical-align: text-bottom; margin-left: 0.25rem; margin-right: 0.5rem;')
    slot.append(spoil, value)
    return { slot, icon, value }
  }

  private bounce(element: HTMLElement | null) {
    if (element) {
      element.setAttribute('style', 'display: block;')
      element.classList.add(styles.bounce)
      setTimeout(() => {
        element.classList.remove(styles.bounce)
      }, 325)
    }
  }

  public get element() {
    return this.container
  }
}
