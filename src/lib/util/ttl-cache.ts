export class TTLCache<T> {
  #cache: T | null = null
  #lastFetch: number = 0

  constructor (private ttlMs: number) { }

  set (value: T) {
    this.#cache = value
    this.#lastFetch = Date.now()
  }

  get (): T | null {
    if (!this.#cache || Date.now() - this.#lastFetch > this.ttlMs) {
      return null
    }
    return this.#cache
  }

  invalidate () {
    this.#cache = null
    this.#lastFetch = 0
  }
}
