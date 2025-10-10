interface FullscreenDocument extends Document {
  mozFullScreenEnabled?: boolean,
  webkitFullscreenEnabled?: boolean,
  mozFullScreenElement: Element | null,
  webkitFullscreenElement: Element | null,
  mozCancelFullScreen: () => Promise<void>,
  webkitExitFullscreen: () => Promise<void>
}

interface FullscreenElement extends HTMLElement {
  mozRequestFullScreen: () => Promise<void>
  webkitRequestFullscreen: () => Promise<void>
  msRequestFullscreen: () => Promise<void>
}

async function fullscreenActivate(el: HTMLElement): Promise<void> {
  const element = (el || document.documentElement) as FullscreenElement
  const d = document as FullscreenDocument
  const fullscreenEnabled = d.fullscreenEnabled || d.mozFullScreenEnabled || d.webkitFullscreenEnabled

  if (!fullscreenEnabled) return;

  try {
    if (element.requestFullscreen) {
      await element.requestFullscreen()
    } else if (element.mozRequestFullScreen) {
      await element.mozRequestFullScreen()
    } else if (element.webkitRequestFullscreen) {
      await element.webkitRequestFullscreen()
    } else if (element.msRequestFullscreen) {
      await element.msRequestFullscreen()
    }
  } catch (error) {
    console.error('Error activating fullscreen:', error)
  }
}

async function fullscreenDeactivate() {
  const d = document as FullscreenDocument
  if (d.exitFullscreen) {
    await d.exitFullscreen()
  } else if (d.mozCancelFullScreen) {
    await d.mozCancelFullScreen()
  } else if (d.webkitExitFullscreen) {
    await d.webkitExitFullscreen()
  }
}

export function isFullscreenActive(): boolean {
  const doc = document as FullscreenDocument;
  return !!(doc.fullscreenElement || doc.mozFullScreenElement || doc.webkitFullscreenElement);
}

export async function fullscreenSwitch(fullscreen: boolean, el: HTMLElement = document.documentElement): Promise<void> {
  if (fullscreen) {
    await fullscreenActivate(el)
  } else if (isFullscreenActive()) {
    await fullscreenDeactivate()
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
