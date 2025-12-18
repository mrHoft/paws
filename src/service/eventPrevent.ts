export class EventPreventService {
  private startY = 0
  private handlers = {
    contextMenu: (event: Event) => { event.preventDefault() },
    touchStart: (event: TouchEvent) => { this.startY = event.touches[0].clientY },
    touchMove: (event: TouchEvent) => {
      if (event.touches[0].clientY - this.startY > 0) {
        console.log('Prevent "swipe to refresh"')
        event.preventDefault()
      }
    }
  }

  public init() {
    // document.addEventListener('contextmenu', this.handlers.contextMenu)

    const userAgent = navigator.userAgent.toLowerCase()
    const isIOS = /iphone|ipad|ipod/.test(userAgent)
    if (isIOS) {
      document.addEventListener('touchstart', this.handlers.touchStart)
      document.addEventListener('touchmove', this.handlers.touchMove, { passive: false })
    }
  }

  public destroy = () => {
    document.removeEventListener('contextmenu', this.handlers.contextMenu)
    document.removeEventListener('touchstart', this.handlers.touchStart)
    document.removeEventListener('touchmove', this.handlers.touchMove)
  }
}
