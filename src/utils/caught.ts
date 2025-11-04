import type { TCaught } from "~/const"

export const caughtNameTransform = (name: string) => {
  let n = name.replace(/\d/, '')
  if (n === 'grasshopper') n = 'butterfly'
  return n as keyof TCaught
}
