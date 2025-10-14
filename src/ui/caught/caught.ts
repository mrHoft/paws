import type { TAnimalName } from "~/const"
import { spoilSrc } from "~/ui/icons";
import { Storage } from '~/service/storage'

import styles from './caught.module.css'

const slots: Partial<TAnimalName>[] = ['butterfly', 'grasshopper', 'mouse', 'bird']

const isAnimalName = (name: string): name is TAnimalName =>
  slots.includes(name as TAnimalName);

export class Caught {
  private static _instance: Caught
  private storage!: Storage
  private container!: HTMLDivElement
  private count: Record<TAnimalName, number> = {
    butterfly: 0,
    grasshopper: 0,
    frog: 0,
    mouse: 0,
    bird: 0,
  }
  private slot: Partial<Record<TAnimalName, HTMLSpanElement>> = {}

  constructor() {
    if (Caught._instance) return Caught._instance
    Caught._instance = this

    this.storage = new Storage()
    const initialCaught = this.storage.get<Record<TAnimalName, number>>('data.caught')
    if (initialCaught) this.count = { ...initialCaught }

    this.container = document.createElement('div')
    this.container.className = styles.caught
    for (const name of slots) {
      const { slot, value } = this.createSlot(name)
      this.slot[name] = value
      this.container.append(slot)
    }
  }

  public setCount(value: Record<TAnimalName, number>) {
    this.count = { ...value }
  }

  public handleUpdate = (name: string) => {
    if (isAnimalName(name)) {
      this.count[name] += 1
      this.slot[name]!.innerText = this.count[name].toString()
      this.storage.set(`data.caught.${name}`, this.count[name])
    }
  }

  public handleReset = () => {
    for (const name of slots) {
      this.count[name] = 0
      this.slot[name]!.innerText = '0'
    }
  }

  private createSlot = (name: TAnimalName) => {
    const slot = document.createDocumentFragment()
    const icon = document.createElement('img')
    icon.src = spoilSrc[name]
    icon.alt = name
    const value = document.createElement('span')
    value.innerText = this.count[name].toString()
    value.setAttribute('style', 'vertical-align: text-bottom; margin-left: 0.25rem; margin-right: 0.5rem;')
    slot.append(icon, value)
    return { slot, value }
  }

  public get element() {
    return this.container
  }
}
