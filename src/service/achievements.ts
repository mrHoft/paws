import { Storage } from "./storage"
import { Message } from "~/ui/message/message"
import { UPGRADES, ACHIEVEMENTS, SCENE_NAMES, ANIMALS, type TAnimalName } from "~/const"
import { Localization } from '~/service/localization'
import { inject, Injectable } from "~/utils/inject"

@Injectable
export class AchievementsService {
  private storage: Storage
  private message: Message
  private loc: Localization
  private newOnes = 0
  private upgrades: { count: number, grades: number, total: number }
  private callbacks: { onUpdate?: () => void } = {}
  private caught = new Set<TAnimalName>()

  constructor() {
    this.storage = inject(Storage)
    this.message = inject(Message)
    this.loc = inject(Localization)

    const keys = Object.keys(UPGRADES)
    const count = keys.length
    const grades = UPGRADES[keys[0]].grades
    const total = count * grades
    this.upgrades = { count, grades, total }
  }

  public check(key: 'upgrade' | 'stage' | 'dog' | 'cactus' | 'streak' | 'catch' | 'pegasus', name?: TAnimalName) {
    const cur = this.storage.get<string[]>('data.ach') || []

    if (key === 'pegasus' && !cur.includes('pegasus')) {
      this.save('pegasus')
    }

    if (key === 'upgrade') {
      const upgrades = this.storage.get<Record<string, number>>('data.upg')
      const upgradesCount = Object.values(upgrades).reduce((acc, cur) => acc + cur, 0)
      const upgradesTaken = Object.values(upgrades).reduce((acc, cur) => cur > 0 ? acc + 1 : acc, 0)
      if (upgradesCount > 0 && !cur.includes('upgrade1')) {
        this.save('upgrade1')
      }
      if (upgradesTaken >= this.upgrades.count && !cur.includes('upgrade2')) {
        this.save('upgrade2')
      }
      if (upgradesCount >= this.upgrades.total && !cur.includes('upgrade3')) {
        this.save('upgrade3')
      }
    }

    if (key === 'stage') {
      const sceneData = Object.values(this.storage.get<Record<string, { stars: number, score: number }>>('data.scene'))
      const perfect = sceneData.filter(({ stars }) => stars === 3).length
      if (!cur.includes('perfect') && perfect > 0) {
        this.save('perfect')
      }
      if (!cur.includes('stages1') && sceneData.length === SCENE_NAMES.length) {
        this.save('stages1')
      }
      if (!cur.includes('stages2') && perfect === SCENE_NAMES.length) {
        this.save('stages2')
      }

      const stars = this.storage.get<number>('data.total.stars')
      if (!cur.includes('stars1') && stars >= 100) {
        this.save('stars1')
      }
      if (!cur.includes('stars2') && stars >= 500) {
        this.save('stars2')
      }
      if (!cur.includes('stars3') && stars >= 1000) {
        this.save('stars3')
      }
    }

    if (key === 'dog' && !cur.includes('dog')) {
      this.save('dog')
    }

    if (key === 'cactus' && !cur.includes('cactus')) {
      this.save('cactus')
    }

    if (key === 'streak' && !cur.includes('streak')) {
      this.save('streak')
    }

    if (key === 'catch') {
      const total = this.storage.get<Record<string, number>>('data.total')
      const count = Object.values(total).reduce((acc, cur) => acc + cur, 0)
      if (count >= 50 && !cur.includes('catch1')) {
        this.save('catch1')
      }
      if (count >= 250 && !cur.includes('catch2')) {
        this.save('catch2')
      }
      if (count >= 1000 && !cur.includes('catch3')) {
        this.save('catch3')
      }

      if (name) {
        this.caught.add(name)
        if (!cur.includes('birds') && this.caught.has('bird1') && this.caught.has('bird2')) {
          this.save('birds')
        }
        if (!cur.includes('insects') && this.caught.has('butterfly1') && this.caught.has('butterfly1') && this.caught.has('grasshopper')) {
          this.save('insects')
        }
        if (!cur.includes('zoo') && this.caught.size === ANIMALS.length) {
          this.save('zoo')
        }
      }
    }
  }

  public save(key: string) {
    const cur = this.storage.get<string[]>('data.ach') || []
    this.storage.set('data.ach', [...cur, key])
    this.newOnes += 1
    this.showMessage(key)
    if (this.callbacks.onUpdate) this.callbacks.onUpdate()
  }

  private showMessage = (key: string) => {
    const icon = document.createElement('img')
    icon.src = `./icons/achievements/${ACHIEVEMENTS[key].icon}.svg`
    icon.setAttribute('style', 'width: 2.5em; height: 2.5em; background-color: darkorange;')
    const content = document.createDocumentFragment()
    const text = this.loc.get(`ach.${key}`)
    const index = text.indexOf('(')
    const title = document.createElement('div')
    title.textContent = index > 0 ? text.slice(0, index - 1) : text
    const desc = document.createElement('div')
    desc.textContent = index > 0 ? text.slice(index) : ''
    desc.setAttribute('style', 'font-size: smaller;')
    const msg = document.createElement('div')
    msg.append(title, desc)
    content.append(icon, msg)
    this.message.show(content, 'blank')
  }

  public get(key: string) {
    const cur = this.storage.get<string[]>('data.ach') || []
    return cur.includes(key)
  }

  public get new() {
    return this.newOnes
  }

  public clear() {
    const newOnes = this.newOnes
    this.newOnes = 0
    if (newOnes > 0 && this.callbacks.onUpdate) this.callbacks.onUpdate()
  }

  public registerCallbacks = ({ onUpdate }: { onUpdate?: () => void }) => {
    if (onUpdate) this.callbacks.onUpdate = onUpdate
  }
}
