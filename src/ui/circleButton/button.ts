import styles from './button.module.css'

export const circleButton = (iconSrc: string) => {
  const button = document.createElement('div')
  button.className = styles.button
  const circle = document.createElement('div')
  circle.className = styles.circle
  const inner = document.createElement('div')
  inner.className = styles.inner
  const img = document.createElement('img')
  img.src = iconSrc
  inner.append(img)
  button.append(circle, inner)
  return button
}
