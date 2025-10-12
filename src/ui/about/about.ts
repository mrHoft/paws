export function about() {
  const link = document.createElement('a')
  link.innerText = 'mrHoft'
  link.href = 'https://github.com/mrHoft'

  return [
    'Developed by\u00a0',
    link,
    '\u00a0in 2025.'
  ]
}
