'use strict'

export function remove (array, item) {
  array.splice(array.indexOf(item), 1)
}

export function not (v1) {
  return function (v2) {
    return v1 !== v2 
  }
}

export function propLessThan (prop, obj1) {
  return function (obj2) {
    return obj1[prop] < obj2[prop] 
  } 
}

export function both (fn1, fn2) {
  return function (e) {
    return fn1(e) && fn2(e) 
  }
}

export function either (f1, f2, e1, e2) {
  return (f1(e1) && f2(e2)) || (f1(e2) && f2(e1))
}

export function all (...fns) {
  return function (e) {
    for (let fn of fns) {
      if (!fn(e)) return false
    }
    return true
  }
}

export function instanceOf (Ctor) {
  return function (e) {
    return e instanceof Ctor 
  }
}
