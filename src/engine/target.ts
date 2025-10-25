import { GAME, SCENE_TARGETS, type TSceneName, type TTargetName } from "~/const";
import { Injectable } from "~/utils/inject";

@Injectable
export class TargetService {
  private sceneName?: TSceneName
  private sequence?: TTargetName[]
  private progress = { top: 0, bottom: 0 }

  public setup({ sceneName, multiplayer }: { sceneName: TSceneName, multiplayer?: 'top' | 'bottom' }) {
    this.sceneName = sceneName
    if (multiplayer === 'top') {
      this.sequence = Array.from({ length: GAME.roundLength }, this.getRandomTarget)
      this.progress = { top: 0, bottom: 0 }
    }
  }

  public getTarget = (player?: 'top' | 'bottom') => {
    if (!player) {
      return this.getRandomTarget()
    }

    const progress = this.progress[player]
    this.progress[player] += 1
    if (this.progress[player] >= GAME.roundLength) {
      this.progress[player] = 0
    }
    return this.sequence ? this.sequence[progress] : this.getRandomTarget()
  }

  private getRandomTarget = () => {
    if (this.sceneName) {
      const targets = SCENE_TARGETS[this.sceneName]
      const rand = Math.floor(Math.random() * targets.length)
      return targets[rand]
    } else {
      return 'none'
    }
  }
}
