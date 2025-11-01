type TFunc = (..._args: unknown[]) => void

export function throttle(func: TFunc, delay = 100) {
  let timerFlag: ReturnType<typeof setTimeout> | null = null

  return (...args: unknown[]) => {
    if (timerFlag === null) {
      func(...args)
      timerFlag = setTimeout(() => {
        timerFlag = null
      }, delay)
    }
  }
}

export function debounce(func: TFunc, delay = 100) {
  let timerFlag: ReturnType<typeof setTimeout> | null = null

  return (...args: unknown[]) => {
    if (timerFlag !== null) clearTimeout(timerFlag)

    timerFlag = setTimeout(() => {
      func(...args)
    }, delay)
  }
}
