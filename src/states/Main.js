'use strict'

import Pixi from 'pixi.js'
import GameState from '../GameState'
import World from '../World'
import {Monster, Fireball, Enemy, Spawn} from '../entities'
import {has, whereProp, hasThree} from '../predicates'
import {findWhere} from '../query'
import {runTasks, withClock} from '../tasks'
import {doesCollide, resolveCollision} from '../physics'
import {remove, propLessThan, both, either, instanceOf, all} from '../utils'

const isPlayer = instanceOf(Monster)
const isFireball = instanceOf(Fireball)
const isEnemy = instanceOf(Enemy)
const {abs, round, sin, cos} = Math
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
  const {game} = state

  while (true) {
    if (state.player.dead) game.state = game.states[2]
    yield 
  }
}

function * updateAABBs (state) {
  const query = has('aabb')

  while (true) {
    let {entities} = state

    for (let e of findWhere(query, entities)) {
      e.aabb.position.x = e.worldTransform.tx 
      e.aabb.position.y = e.worldTransform.ty
      e.aabb.size.x = e.width
      e.aabb.size.y = e.height
    }
    yield 
  }
}

function * getColliderPairs (entities) {
  let query1 = both(has('aabb'), whereProp('dying', false))

  for (let e1 of findWhere(query1, entities)) {
    let query2 = both(query1, propLessThan('id', e1))

    for (let e2 of findWhere(query2, entities)) {
      if (doesCollide(e1.aabb, e2.aabb)) yield([e1, e2])
    }
  }
}

function * killSequence (state, entity) {
  function flyOff () {
    entity.scale.x += 0.01
    entity.scale.y += 0.01
    entity.rotation += 0.5
  }
  let tasks = [
    Sequence(
      freeze(entity), 
      waitFor(15), 
      unfreeze(entity), 
      doFor(flyOff, 30), 
      kill(entity)
    )
  ] 

  while (tasks.length > 0) yield runTasks(tasks)
}

function * doFor (fn, duration) {
  let timer = 0

  while (timer++ < duration) yield fn()
}

const noop = () => {}
const waitFor = doFor.bind(null, noop)

function * Sequence (...taskList) {
  for (let task of taskList) {
    while (!task.next().done) yield
  }
}

function * kill (entity) {
  entity.dead = true
}

function * freeze (entity) {
  entity.dying = true
  entity.alpha = 0.5
  entity.doPhysics = false 
}

function * unfreeze (entity) {
  entity.velocity.y = - 40
  entity.velocity.x = 0
  entity.doPhysics = true
}

function * checkCollisions (state) {
  let tasks = []

  while (true) {
    let {entities} = state 

    for (let [e1, e2] of getColliderPairs(entities)) {
      if (either(isPlayer, isEnemy, e1, e2)) {
        tasks.push(killSequence(state, e1))
        tasks.push(killSequence(state, e2))
      }
    }
    runTasks(tasks) 
    yield
  }
}

function * doPhysics (state) {
  const query = all(has('position'), has('velocity'), has('acceleration'), whereProp('doPhysics', true))

  while (true) {
    let {game, entities, world} = state 
    let {dT} = game.clock

    for (let e of findWhere(query, entities)) {
      let newYVel = e.velocity.y + e.acceleration.y * dT
      let newYPos = e.position.y + newYVel * dT
      let groundPenetrationDepth = (newYPos + e.height / 2) - world.y

      e.velocity.x += e.acceleration.x * dT 
      e.position.x += e.velocity.x * dT 
      if (groundPenetrationDepth > 0 && !e.dying) {
        e.velocity.y = -1 * e.elasticity * e.velocity.y
        e.position.y = world.y - (e.height / 2)
      } else {
        e.velocity.y = newYVel
        e.position.y = newYPos
      }
    }
    yield
  }
}

function * killExpired (state) {
  while (true) {
    let {game, entities} = state 
    let {thisTime} = game.clock

    for (let e of findWhere(has('deathTime'), entities)) {
      if (e.deathTime < thisTime) {
        remove(state.entities, e)
        state.fg.removeChild(e)
      }
    }
    yield
  }
}

function * processInput (state) {
  while (true) {
    let {game, player, world} = state
    let {dT, thisTime} = game.clock
    let controller = navigator.getGamepads()[0]
    var xVel = 0

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
    yield
  }
}

function *drawDebug ({entities, debug}) {
  while (true) {
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
    yield 
  }
}

function * spawnEnemy (state, position) {
  while (true) {
    let thisTime = state.game.clock.thisTime
    let enemy = new Enemy({
      x: 200 * sin(thisTime), 
      y: 200 * cos(thisTime)
    }, thisTime)

    enemy.velocity.x = 2
    enemy.velocity.y = 0
    state.fg.addChild(enemy)
    state.entities.push(enemy)
    yield 
  }
}

function everyNth (n) {
  return function every (clock) {
    return (clock.thisTime | 0) % n === 0
  }
}

export default function Main (clock) {
  let tasks = [
    processInput(this),
    withClock(everyNth(15), clock, spawnEnemy(this, {x: 0, y: 0})),
    doPhysics(this),
    updateAABBs(this),
    checkCollisions(this),
    withClock(everyNth(10), clock, killExpired(this)),
    withClock(everyNth(30), clock, checkWinningCondition(this)),
    //drawDebug(this)
  ]
  let ui = new Pixi.Container
  let fg = new Pixi.Container
  let bg = new Pixi.Container
  let m = new Monster({x: 500, y: 200})
  let entities = [m]
  let debug = new Pixi.Graphics

  //setup ui
  ui.zPosition = 10
  ui.addChild(debug)

  //setup fg
  fg.zPosition = 0
  fg.addChild(m)

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
}
