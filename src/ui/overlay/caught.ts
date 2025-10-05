import type { TAnimalName } from "~/const"

const spoilSrc: Record<TAnimalName, string> = {
  butterfly: '/spoil/butterfly.svg',
  grasshopper: '/spoil/frog.svg',
  frog: '/spoil/frog.svg',
  mouse: '/spoil/mouse.svg',
  bird: '/spoil/bird.svg',
}

const slots: Partial<TAnimalName>[] = ['butterfly', 'grasshopper', 'mouse', 'bird']

const isAnimalName = (name: string): name is TAnimalName =>
  slots.includes(name as TAnimalName);

export class Caught {
  private container: HTMLDivElement
  private count: Record<TAnimalName, number> = {
    butterfly: 0,
    grasshopper: 0,
    frog: 0,
    mouse: 0,
    bird: 0,
  }
  private slot: Partial<Record<TAnimalName, HTMLSpanElement>> = {}

  constructor() {
    this.container = document.createElement('div')
    for (const name of slots) {
      const { slot, value } = this.createSlot(name)
      this.slot[name] = value
      this.container.append(slot)
    }
  }

  public handleUpdate = (name: string) => {
    if (isAnimalName(name)) {
      this.count[name] += 1
      this.slot[name]!.innerText = this.count[name].toString()
    }
  }

  private createSlot = (name: TAnimalName) => {
    const slot = document.createDocumentFragment()
    const icon = document.createElement('img')
    icon.src = spoilSrc[name]
    icon.width = icon.height = 20
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
