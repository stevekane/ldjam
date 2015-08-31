'use strict'

import Pixi from 'pixi.js'
import GameState from '../GameState'
import World from '../World'
import {Monster, Fireball, Enemy, Spawn} from '../entities'
import {has, whereProp, hasThree} from '../predicates'
import {findWhere} from '../query'
import {runTasks} from '../tasks'
import {doesCollide, resolveCollision} from '../physics'
import {remove, propLessThan, both, either, instanceOf, all} from '../utils'

const isPlayer = instanceOf(Monster)
const isFireball = instanceOf(Fireball)
const isEnemy = instanceOf(Enemy)
const {abs, round} = Math
//TODO: need runtime code to handle different platforms for now use based on dev-os
//WINDOWS
const BUTTONS = {
  UP: 12,
  RIGHT: 15,
  DOWN: 13,
  LEFT: 14,
  A: 0,
  B: 1
}
//OSX
//const BUTTONS = {
//  UP: 11,
//  RIGHT: 14,
//  DOWN: 12,
//  LEFT: 13,
//  A: 0,
//  B: 1
//}

function * checkWinningCondition (state) {
  while (true) {
    yield 
  }
}

function * updateAABBs (state) {
  const query = has('aabb')

  while (true) {
    yield 
    let {entities} = state

    for (let e of findWhere(query, entities)) {
      e.aabb.position.x = e.worldTransform.tx 
      e.aabb.position.y = e.worldTransform.ty
      e.aabb.size.x = e.width
      e.aabb.size.y = e.height
    }
  }
}

function * getColliderPairs (entities) {
  let query1 = both(has('aabb'), whereProp('dead', false))

  for (let e1 of findWhere(query1, entities)) {
    let query2 = both(query1, propLessThan('id', e1))

    for (let e2 of findWhere(query2, entities)) {
      if (doesCollide(e1.aabb, e2.aabb)) yield([e1, e2])
    }
  }
}

function * killEnemy (enemy) {
  let tasks = [
    spin(30, enemy),
    Sequence(freeze(enemy), unfreeze(enemy), growFor(10, enemy))
  ] 

  yield
  while (tasks.length > 0) {
    runTasks(tasks)
    yield
  }
}

function handlePlayerEnemy (e1, e2, collisionTasks) {
  let enemy = e1 instanceof Monster ? e2 : e1

  collisionTasks.push(killEnemy(enemy))
}

function * wait (duration) {
  yield
  let timer = 0 

  while (timer++ < duration) yield
}

function * spin (duration, entity) {
  yield
  let timer = 0

  while (timer++ < duration) {
    entity.rotation += 0.5
    yield
  }
}

function * Sequence (...taskList) {
  yield

  for (let task of taskList) {
    while (!task.next().done) yield
  }
}

function * freeze (enemy) {
  yield

  enemy.dead = true
  enemy.alpha = 0.5
  enemy.doPhysics = false 
}

function * growFor (duration, entity) {
  yield

  let timer = 0

  while (timer++ < duration) {
    entity.scale.x += 0.1 
    entity.scale.y += 0.1
    yield
  }
}

function * unfreeze (entity) {
  yield

  entity.velocity.y = - 40
  entity.velocity.x = 0
  entity.doPhysics = true
}

function * checkCollisions (state) {
  let tasks = []

  while (true) {
    yield
    let {entities} = state 

    for (let [e1, e2] of getColliderPairs(entities)) {
      if      (either(isPlayer, isEnemy, e1, e2)) handlePlayerEnemy(e1, e2, tasks)
    }
    runTasks(tasks) 
  }
}

function * doPhysics (state) {
  const query = all(has('position'), has('velocity'), has('acceleration'), whereProp('doPhysics', true))

  while (true) {
    yield

    let {game, entities, world} = state 
    let {dT} = game.clock

    for (let e of findWhere(query, entities)) {
      let newYVel = e.velocity.y + e.acceleration.y * dT
      let newYPos = e.position.y + newYVel * dT
      let groundPenetrationDepth = (newYPos + e.height / 2) - world.y

      e.velocity.x += e.acceleration.x * dT 
      e.position.x += e.velocity.x * dT 
      if (groundPenetrationDepth > 0 && !e.dead) {
        e.velocity.y = -1 * e.elasticity * e.velocity.y
        e.position.y = world.y - (e.height / 2)
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

    let {game, player, world} = state
    let {dT, thisTime} = game.clock
    let controller = navigator.getGamepads()[0]
    var xVel = 0

    if (!controller) {
      state.paused = true
      continue
    }

    //MOVEMENT
    if (controller.buttons[BUTTONS.RIGHT].pressed) {
      xVel = xVel + player.walkSpeed
      player.scale.x = -1.0
    }
    if (controller.buttons[BUTTONS.LEFT].pressed) {
      xVel = xVel - player.walkSpeed
      player.scale.x = 1.0
    }
    player.velocity.x = xVel

    //ACTIONS
    if (controller.buttons[BUTTONS.A].pressed) {
      if (player.nextFireTime < thisTime) {
        let scalar = player.scale.x < 0 ? 1 : -1
        let x = player.position.x + scalar * 20
        let y = player.position.y
        let fb = new Fireball({x, y}, thisTime)

        fb.velocity.y = -15
        fb.velocity.x = scalar * 20
        player.nextFireTime = thisTime + player.fireballTimeout
        state.entities.push(fb)
        state.fg.addChild(fb)
      }
    }
    if (controller.buttons[BUTTONS.B].pressed) {
      if (player.position.y >= world.y - (player.height / 2)) {
        player.velocity.y -= player.jumpVelocity
      }
    }
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

function * printDebug ({tasks}) {
  while (true) {
    yield

    console.log(tasks.length) 
  }
}

function * runIntervals (state) {
  while (true) {
    yield 

    let {game, entities} = state
    let {thisTime} = game.clock

    for (let e of findWhere(has('rate'), entities)) {
      if (round(thisTime) % e.rate === 0) e.fn(e)
    }
  }
}

export default function Main () {
  let tasks = [
    //printDebug(this),
    processInput(this),
    runIntervals(this),
    doPhysics(this),
    updateAABBs(this),
    checkCollisions(this),
    killExpired(this),
    checkWinningCondition(this),
    //drawDebug(this)
  ]
  let ui = new Pixi.Container
  let fg = new Pixi.Container
  let bg = new Pixi.Container
  let m = new Monster({x: 100, y: 200})
  let self = this
  let spawnEnemy = function (e) {
    let enemy = new Enemy({x: e.position.x, y: e.position.y}, 
                          self.game.clock.thisTime)  

    enemy.velocity.x = e.spawnVelocity.x
    enemy.velocity.y = e.spawnVelocity.y
    entities.push(enemy)
    fg.addChild(enemy)
  }
  let spawn1 = new Spawn(spawnEnemy, 15, {x: 10, y: 10}, 1, {x: 0, y: 0})
  let spawn2 = new Spawn(spawnEnemy, 3, {x: 15, y: 0}, 5, {x: 0, y: 100})
  let spawn3 = new Spawn(spawnEnemy, 10, {x: 10, y: -30}, 12, {x: 0, y: 200})
  let entities = [m, spawn1, spawn2, spawn3]
  let debug = new Pixi.Graphics

  //setup ui
  ui.zPosition = 10
  ui.addChild(debug)

  //setup fg
  fg.zPosition = 0
  fg.addChild(m, spawn1)
  fg.addChild(m, spawn2)
  fg.addChild(m, spawn3)

  //setup bg
  bg.zPosition = -10

  GameState.call(this, 'main', tasks)
  this.world = new World(640, 480)
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
}

