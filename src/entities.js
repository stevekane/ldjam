'use strict'

import {Sprite, Texture} from 'pixi.js'
import {AABB} from './physics'
import {v4 as UUID} from 'node-uuid'

const GRAVITY = 6

class CoreSprite extends Sprite {
  constructor (fileName, position) {
    super(new Texture.fromImage(fileName))

    this.id = UUID()
    this.anchor.x = 0.5
    this.anchor.y = 0.5
    this.aabb = new AABB({x: 0, y: 0}, {x: 0, y: 0})
    this.position = position 
    this.velocity = {x: 0, y: 0}
    this.acceleration = {x: 0, y: GRAVITY}
    this.doPhysics = true

    Object.defineProperty(this, 'direction', {
      get () { 
        return this.scale.x > 0 ? 'left' : 'right' 
      } 
    })
  }
}

export class Monster extends CoreSprite {
  constructor (position) {
    super('bowser.gif', position)
    this.walkSpeed = 5
    this.fireballTimeout = 3
    this.nextFireTime = 0
    this.elasticity = 0
    this.jumpVelocity = 35
  }
}

export class Fireball extends CoreSprite {
  constructor (position, spawnTime) {
    super('fireball.gif', position) 
    this.scale.x = 0.5
    this.scale.y = 0.5
    this.deathTime = spawnTime + 100
    this.elasticity = 1.2
  }
}

export class Enemy extends CoreSprite {
  constructor (position, spawnTime) {
    super('fireball.gif', position)
    this.scale.x = 0.4
    this.scale.y = 0.4
    this.deathTime = spawnTime + 300
    this.elasticity = 1.0
  }
}

export class Spawn extends PIXI.Container {
  constructor (fn, rate, spawnVelocity, variance, position) {
    super()
    this.fn = fn
    this.rate = rate
    this.position = position
    this.spawnVelocity = spawnVelocity
    this.variance = variance
  }
}
