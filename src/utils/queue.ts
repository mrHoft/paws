type El = {
  value: number
  next: El | null
  prev: El | null
} | null

export class Queue {
  private size = 0
  private head: El = null
  private tail: El = null

  constructor() {
    this.size = 0
    this.head = null
    this.tail = null
  }

  public enqueue(value: number) {
    const node: El = { value, next: null, prev: null }
    node.prev = this.tail
    if (this.tail) {
      this.tail.next = node
      this.tail = node
    } else this.head = this.tail = node

    return ++this.size
  }

  public dequeue(): number | null {
    if (!this.head) return null
    const node = this.head
    const next = this.head?.next
    if (next) {
      next.prev = null
      this.head = next
    } else this.tail = this.head = null
    --this.size
    return node.value
  }

  public crop(targetSize: number) {
    while (this.size > targetSize) {
      this.dequeue()
    }
  }

  public average(targetSize: number): number {
    if (!this.head) return 0
    this.crop(targetSize)

    let sum = 0
    let i = 0
    let node: El = this.head
    while (node) {
      sum += node.value
      ++i
      node = node.next
    }

    return Math.floor(sum / i)
  }

  public peek() {
    return this.head
  }

  public isEmpty() {
    return this.size == 0
  }

  public clear() {
    this.size = 0
    this.head = null
    this.tail = null
  }
}
