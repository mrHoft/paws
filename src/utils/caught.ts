import type { TCaught } from "~/const"

export const caughtNameTransform = (name: string) => {
  let n = name.replace(/\d/, '')
  if (n === 'grasshopper' || n === 'butterfly') n = 'insect'
  return n as keyof TCaught
}
