export function formatTime(ms: number) {
  const m = Math.floor(ms / 60000)
  if (m > 59) return '59:59'
  const s = Math.floor(ms / 1000 - m * 60)
  return `${`0${m}`.slice(-2)}:${`0${s}`.slice(-2)}`
}
