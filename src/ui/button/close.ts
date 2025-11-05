import { iconSrc } from "../icons"

import styles from './button.module.css'

export const buttonClose = () => {
  const button = document.createElement('div')
  button.className = styles.btn_close
  const img = document.createElement('img')
  img.src = iconSrc.close
  img.setAttribute('draggable', 'false')
  button.append(img)

  return button
}
