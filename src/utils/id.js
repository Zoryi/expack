let _counter = Date.now()

export function createId(prefix) {
  return `${prefix}-${++_counter}-${Math.random().toString(36).slice(2, 6)}`
}
