type TDocument = Document & {
  mozFullScreenEnabled?: boolean,
  webkitFullscreenEnabled?: boolean,
  mozFullScreenElement: Element | null,
  webkitFullscreenElement: Element | null,
  mozCancelFullScreen: () => Promise<void>,
  webkitExitFullscreen: () => Promise<void>
}

type TElement = HTMLElement & {
  mozRequestFullScreen: () => Promise<void>
  webkitRequestFullscreen: () => Promise<void>
  msRequestFullscreen: () => Promise<void>
}

function fullScreenActivate(el: HTMLElement) {
  const element = (el || document.documentElement) as TElement
  const d = document as TDocument
  const fullscreenEnabled = d.fullscreenEnabled || d.mozFullScreenEnabled || d.webkitFullscreenEnabled

  if (fullscreenEnabled) {
    if (element.requestFullscreen) {
      element.requestFullscreen() // W3C spec
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen() // Firefox
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen() // Safari
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen() // IE/Edge
    }
  }
}

function fullScreenDeactivate() {
  const d = document as TDocument
  if (d.exitFullscreen) {
    d.exitFullscreen()
  } else if (d.mozCancelFullScreen) {
    d.mozCancelFullScreen()
  } else if (d.webkitExitFullscreen) {
    d.webkitExitFullscreen()
  }
}

function fullScreenSwitch(fullscreen: boolean, el: HTMLElement = document.documentElement) {
  if (fullscreen) {
    fullScreenActivate(el)
  } else {
    const d = document as TDocument
    const fullscreenElement = d.fullscreenElement || d.mozFullScreenElement || d.webkitFullscreenElement
    if (fullscreenElement) {
      fullScreenDeactivate()
    }
  }
}

/*
document.addEventListener('fullscreenchange', event => {
  const fullscreenElement =
    document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement
  if (fullscreenElement) {
    console.log('Entered fullscreen.')
  } else {
    console.log('Exited fullscreen.')
  }
})
 */
export default fullScreenSwitch
