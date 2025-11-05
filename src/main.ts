import './style.css'
import { App } from './app'

new App().init()


/* // Sound testing
import { SoundService } from "~/service/sound";
const soundService = new SoundService()
const soundNames = [
  'tap',
  'pum',
  'pup',
  'ta',
  'block',
  'tone-low',
  'tone-high'
]

document.addEventListener('keyup', event => {
  const soundName = soundNames[Number(event.code.replace('Digit', ''))]
  console.log('Key code:', event.code, 'soundName:', soundName)
  if (soundName) {
    soundService.play(soundName)
  }
}) */
