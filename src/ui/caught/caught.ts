import type { TAnimalName } from "~/const"
import { spoilSrc } from "~/ui/icons";
import { Storage } from '~/service/storage'
import { inject } from "~/utils/inject";

import styles from './caught.module.css'

const slots = ['butterfly', 'mouse', 'bird', 'frog']

export class Caught {
  private static _instance: Caught
  private storage!: Storage
  private container!: HTMLDivElement
  private count: Record<string, number> = {
    butterfly: 0,
    grasshopper: 0,
    frog: 0,
    mouse: 0,
    bird: 0,
  }
  private slot: Partial<Record<string, { icon: HTMLImageElement, value: HTMLSpanElement }>> = {}

  constructor() {
    if (Caught._instance) return Caught._instance
    Caught._instance = this

    this.storage = inject(Storage)
    const initialCaught = this.storage.get<Record<string, number>>('data.caught')
    if (initialCaught) this.count = { ...initialCaught }

    this.container = document.createElement('div')
    this.container.className = styles.caught
    for (const name of slots) {
      const { slot, icon, value } = this.createSlot(name)
      this.slot[name] = { icon, value }
      this.container.append(slot)
    }
  }

  public setCount(value: Record<TAnimalName, number>) {
    this.count = { ...value }
  }

  public handleUpdate = (name: string) => {
    let n = name.replace(/\d/, '')
    if (n === 'grasshopper') n = 'butterfly'
    if (slots.includes(n)) {
      this.count[n] += 1
      this.slot[n]!.value.innerText = this.count[n].toString()
      this.storage.set(`data.caught.${n}`, this.count[n])

      this.slot[n]!.icon.classList.add(styles.bounce)
      setTimeout(() => {
        this.slot[n]!.icon.classList.remove(styles.bounce)
      }, 325)
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
    spoil.append(icon)
    const value = document.createElement('span')
    value.innerText = this.count[name].toString()
    // value.setAttribute('style', 'vertical-align: text-bottom; margin-left: 0.25rem; margin-right: 0.5rem;')
    slot.append(spoil, value)
    return { slot, icon, value }
  }

  public get element() {
    return this.container
  }
}
