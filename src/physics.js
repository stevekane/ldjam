'use strict'

const {min} = Math

export class AABB {
  constructor (position, size) {
    this.position = position
    this.size = size
  }

  get x1 () {
    return this.position.x - this.size.x / 2 
  }

  get y1 () {
    return this.position.y - this.size.y / 2 
  }

  get x2 () {
    return this.position.x + this.size.x / 2
  }

  get y2 () {
    return this.position.y + this.size.y / 2
  }
}

export function doesCollide (aabb1, aabb2) {
  return (aabb1.x2 >= aabb2.x1 &&
          aabb1.x1 <= aabb2.x2 &&
          aabb1.y2 >= aabb2.y1 &&
          aabb1.y1 <= aabb2.y2)
}

function collideStatic (e1, e2) {
  const aabb1 = e1.aabb
  const aabb2 = e2.aabb
  const xOverlap = min(aabb1.x2 - aabb2.x1, aabb2.x2 - aabb1.x1)
  const yOverlap = min(aabb1.y2 - aabb2.y1, aabb2.y2 - aabb1.y1)
  const adjustX = yOverlap > xOverlap

  if (adjustX) {
    if (e1.position.x > e2.position.x) {
      e1.position.x += xOverlap
      e1.velocity.x = 0
      e2.velocity.x = 0
    } else {
      e1.position.x -= xOverlap
      e1.velocity.x = 0
      e2.velocity.x = 0
    }
  } else {
    if (e1.position.y > e2.position.y) {
      e1.position.y += yOverlap
      e1.velocity.y = 0
      e2.velocity.y = 0
    } else {
      e1.position.y -= yOverlap
      e1.velocity.y = 0
      e2.velocity.y = 0
    }
  }
}

function collideDynamic (e1, e2) {
  const aabb1 = e1.aabb
  const aabb2 = e2.aabb
  const xOverlap = min(aabb1.x2 - aabb2.x1, aabb2.x2 - aabb1.x1)
  const yOverlap = min(aabb1.y2 - aabb2.y1, aabb2.y2 - aabb1.y1)
  const adjustX = yOverlap > xOverlap

  if (adjustX) {
    if (e1.position.x > e2.position.x) {
      e1.position.x += xOverlap / 2
      e2.position.x -= xOverlap / 2
      e1.velocity.x = 0
      e2.velocity.x = 0
    } else {
      e2.position.x += xOverlap / 2
      e1.position.x -= xOverlap / 2
      e1.velocity.x = 0
      e2.velocity.x = 0
    }
  } else {
    if (e1.position.y > e2.position.y) {
      e1.position.y += yOverlap / 2
      e2.position.y -= yOverlap / 2
      e1.velocity.y = 0
      e2.velocity.y = 0
    } else {
      e2.position.y += yOverlap / 2
      e1.position.y -= yOverlap / 2
      e1.velocity.y = 0
      e2.velocity.y = 0
    }
  }
}

export function resolveCollision (e1, e2) {
  if (e1.static)      return collideStatic(e2, e1)
  else if (e2.static) return collideStatic(e1, e2)
  else                return collideDynamic(e1, e2)
}
