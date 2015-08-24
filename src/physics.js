'use strict'

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
