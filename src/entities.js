'use strict'

import {Sprite, Texture} from 'pixi.js'
import {AABB} from './physics'
import {v4 as UUID} from 'node-uuid'

const GRAVITY = 0.00981

class CoreSprite extends Sprite {
  constructor (fileName) {
    super(new Texture.fromImage(fileName))

    this.id = UUID()
    this.anchor.x = 0.5
    this.anchor.y = 0.5
    this.aabb = new AABB({x: 0, y: 0}, {x: 0, y: 0})

    Object.defineProperty(this, 'direction', {
      get () { 
        return this.scale.x > 0 ? 'left' : 'right' 
      } 
    })
  }
}

export class Monster extends CoreSprite {
  constructor (pos) {
    super('bowser.gif')
    this.position = pos
    this.velocity = {x: 0, y: 0}
    this.acceleration = {x: 0, y: GRAVITY}
    this.walkSpeed = 0.5
    this.fireballTimeout = 300
    this.nextFireTime = 0
  }
}

export class Fireball extends CoreSprite {
  constructor (pos, spawnTime) {
    super('fireball.gif') 
    this.position = pos
    this.velocity = {x: 0, y: 0}
    this.acceleration = {x: 0, y: GRAVITY}
    this.scale.x = 0.5
    this.scale.y = 0.5
    this.deathTime = spawnTime + 2000
  }
}

export class Ground extends CoreSprite {
  constructor (pos) {
    super('ground.png')  
    this.position = pos
    this.velocity = {x: 0, y: 0}
    this.acceleration = {x: 0, y: 0}
    this.static = true
  }
}
