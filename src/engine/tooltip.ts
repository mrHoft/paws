import { Localization } from '~/service/localization'
import { inject } from '~/utils/inject'

export class Tooltip {
  private loc!: Localization
  private tooltip = {
    shown: false,
    firstTip: true,
    firstAnimal: true,
    firstBarrier: true,
    firstTimeout: true,
  }
  private setTooltip: (tooltip: string) => void
  private static __instance: Tooltip

  constructor(setTooltip: (tooltip: string) => void) {
    this.setTooltip = setTooltip
    if (Tooltip.__instance) return Tooltip.__instance
    Tooltip.__instance = this
    this.loc = inject(Localization)
  }

  private set(text?: string) {
    if (!text && this.tooltip.shown) {
      this.setTooltip('')
      this.tooltip.shown = false
      this.tooltip.firstTip = false
      return
    }
    if (typeof text === 'string') {
      this.setTooltip(text)
      this.tooltip.shown = true
    }
  }

  public hide() {
    this.set()
  }

  public show = (reason?: 'start' | 'timeout' | 'barrier' | 'animal') => {
    switch (reason) {
      case 'start':
        if (this.tooltip.firstTip) {
          this.tooltip.firstTip = false
          this.set(this.loc.get('newGame'))
        }
        break
      case 'barrier':
        if (this.tooltip.firstBarrier) {
          this.tooltip.firstBarrier = false
          this.set(this.loc.get('firstBarrier'))
        }
        break
      case 'timeout':
        if (this.tooltip.firstTimeout) {
          this.tooltip.firstTimeout = false
          this.set(this.loc.get('firstTimeout'))
        }
        break
      case 'animal':
        if (this.tooltip.firstAnimal) {
          this.tooltip.firstAnimal = false
          this.set(this.loc.get('firstAnimal'))
        }
    }
  }
}
