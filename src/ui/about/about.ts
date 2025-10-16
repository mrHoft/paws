export function about() {
  const link = document.createElement('a')
  link.innerText = 'mrHoft'
  link.href = 'mailto:mrhoft@yandex.ru'

  return [
    'Developed by\u00a0',
    link,
    '\u00a0in 2025.'
  ]
}
