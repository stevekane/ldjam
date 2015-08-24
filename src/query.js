'use strict'

export function * findWhere (predFn, list) {
  for (let item of list) {
    if (predFn(item)) yield item 
  } 
}
