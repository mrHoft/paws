import type { TCaught } from "~/engine/types"

export const caughtNameTransform = (name: string) => {
  let n = name.replace(/\d/, '')
  if (n === 'grasshopper') n = 'butterfly'
  return n as keyof TCaught
}
