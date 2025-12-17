import { Storage } from "./storage"
import { Message } from "~/ui/message/message"
import { UPGRADES, ACHIEVEMENTS } from "~/const"
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

  public check(key: 'upgrade') {
    const cur = this.storage.get<string[]>('data.ach') || []
    if (key === 'upgrade') {
      const upgrades = this.storage.get<Record<string, number>>('data.upgrades')
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
