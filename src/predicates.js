'use strict'

export function has (prop) {
  return function (e) {
    return !!e[prop] 
  }
}

export function hasBoth (p1, p2) {
  return function (e) {
    return e[p1] && e[p2] 
  }
}

export function hasThree (p1, p2, p3) {
  return function (e) {
    return e[p1] && e[p2] && e[p3] 
  }
}

export function whereProp (prop, value) {
  return function (e) {
    return e[prop] === value 
  }
}
