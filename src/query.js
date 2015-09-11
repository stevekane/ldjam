'use strict'

export function * findWhere (predFn, node) {
  if (predFn(node)) yield node

  for (let child of node.children) {
    yield * findWhere(predFn, child)
  }
}
