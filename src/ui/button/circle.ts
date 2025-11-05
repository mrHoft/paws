import styles from './button.module.css'

export const buttonCircle = ({ src }: { src: string }) => {
  const button = document.createElement('div')
  button.className = styles.button
  const circle = document.createElement('div')
  circle.className = styles.circle
  const inner = document.createElement('div')
  inner.className = styles.inner
  const img = document.createElement('img')
  img.src = src
  img.setAttribute('draggable', 'false')
  inner.append(img)
  button.append(circle, inner)

  return button
}
