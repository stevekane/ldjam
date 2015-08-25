'use strict'

import Pixi from 'pixi.js'
import GameState from '../GameState'
import {Monster, Fireball, Ground} from '../entities'
import {has, whereProp, hasThree} from '../predicates'
import {findWhere} from '../query'
import {doesCollide, resolveCollision} from '../physics'
import {remove, propLessThan, both} from '../utils'

const GRAVITY = 0.5
//TODO: need runtime code to handle different platforms for now use based on dev-os
//WINDOWS
//const BUTTONS = {
//  UP: 12,
//  RIGHT: 15,
//  DOWN: 13,
//  LEFT: 14,
//  A: 0,
//  B: 1
//}
//OSX
const BUTTONS = {
  UP: 11,
  RIGHT: 14,
  DOWN: 12,
  LEFT: 13,
  A: 0,
  B: 1
}

function * checkWinningCondition (state) {
  while (true) {
    yield 
  }
}

function * updateAABBs (state) {
  while (true) {
    yield 
    let {entities} = state

    for (let e of findWhere(has('aabb'), entities)) {
      e.aabb.position.x = e.worldTransform.tx 
      e.aabb.position.y = e.worldTransform.ty
      e.aabb.size.x = e.width
      e.aabb.size.y = e.height
    }
  }
}

function * getColliderPairs (entities) {
  let query1 = has('aabb')

  for (let e1 of findWhere(query1, entities)) {
    let query2 = both(has('aabb'), propLessThan('id', e1))

    for (let e2 of findWhere(query2, entities)) {
      if (doesCollide(e1.aabb, e2.aabb)) yield([e1, e2])
    }
  }
}

function * checkCollisions (state) {
  while (true) {
    yield
    let {entities} = state 

    for (let [e1, e2] of getColliderPairs(entities)) {
      //handleCollision(e1, e2)
    }
  }
}

function * doPhysics (state) {
  while (true) {
    yield
    let {game, entities, GROUND_Y} = state 
    let {dT} = game.clock

    for (let e of findWhere(hasThree('position', 'velocity', 'acceleration'), entities)) {
      let newYVel = e.velocity.y + e.acceleration.y * dT
      let newYPos = e.position.y + newYVel * dT
      let groundPenetrationDepth = (newYPos + e.height / 2) - GROUND_Y

      e.velocity.x += e.acceleration.x * dT 
      e.position.x += e.velocity.x * dT 
      if (groundPenetrationDepth > 0) {
        e.velocity.y = 0
        e.position.y = GROUND_Y - (e.height / 2)
      } else {
        e.velocity.y = newYVel
        e.position.y = newYPos
      }
    }
  }
}

function * killExpired (state) {
  while (true) {
    yield

    let {game, entities} = state 
    let {thisTime} = game.clock

    for (let e of findWhere(has('deathTime'), entities)) {
      if (e.deathTime < thisTime) {
        remove(state.entities, e)
        state.fg.removeChild(e)
      }
    }
  }
}

function * processInput (state) {
  while (true) {
    yield
    let {player} = state
    let {dT, thisTime} = state.game.clock
    let controller = navigator.getGamepads()[0]
    var xVel = 0

    if (!controller) {
      state.paused = true
      continue
    }

    if (controller.buttons[BUTTONS.RIGHT].pressed) {
      xVel = xVel + player.walkSpeed
      player.scale.x = -1.0
    }
    if (controller.buttons[BUTTONS.LEFT].pressed) {
      xVel = xVel - player.walkSpeed
      player.scale.x = 1.0
    }
    if (controller.buttons[BUTTONS.A].pressed) {
      if (player.nextFireTime < thisTime) {
        let scalar = player.scale.x < 0 ? 1 : -1
        let x = player.position.x + scalar * 20
        let y = player.position.y
        let fb = new Fireball({x, y}, thisTime)

        fb.velocity.y = -1.2
        fb.velocity.x = scalar * 1.2
        player.nextFireTime = thisTime + player.fireballTimeout
        state.entities.push(fb)
        state.fg.addChild(fb)
      }
    }
    player.velocity.x = xVel
  }
}

function *drawDebug ({entities, debug}) {
  while (true) {
    yield 

    debug.clear()
    debug.lineStyle(2, 0x0000FF, 0.50)
    debug.beginFill(0xFF700B, 0.50)
    for (let e of findWhere(has('aabb'), entities)) {
      debug.drawRect(
        e.aabb.x1,
        e.aabb.y1,
        e.aabb.x2 - e.aabb.x1,
        e.aabb.y2 - e.aabb.y1
      )
    }
  }
}

export default function Main () {
  let tasks = [
    //printDebug(this),
    processInput(this),
    updateAABBs(this),
    doPhysics(this),
    checkCollisions(this),
    killExpired(this),
    checkWinningCondition(this),
    drawDebug(this)
  ]
  let ui = new Pixi.Container
  let fg = new Pixi.Container
  let bg = new Pixi.Container
  let m = new Monster({x: 100, y: 200})
  let entities = [m]
  let debug = new Pixi.Graphics()

  //setup ui
  ui.zPosition = 10
  ui.addChild(debug)

  //setup fg
  fg.zPosition = 0
  fg.addChild(m)

  //setup bg
  bg.zPosition = -10

  GameState.call(this, 'main', tasks)
  this.entities = entities
  this.ui = ui
  this.fg = fg
  this.bg = bg
  this.debug = debug
  this.stage.addChild(bg)
  this.stage.addChild(fg)
  this.stage.addChild(ui)
  this.player = m
  this.paused = false
  this.GROUND_Y = 400
}

