import styles from './button.module.css'

export const buttonIcon = ({ src }: { src: string }) => {
  const button = document.createElement('div')
  const icon = document.createElement('img')
  icon.src = src
  icon.width = icon.height = 40
  button.append(icon)
  button.className = styles.btn_icon

  return button
}
