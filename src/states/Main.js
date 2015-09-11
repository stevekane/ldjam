'use strict'

import Pixi from 'pixi.js'
import GameState from '../GameState'
import World from '../World'
import {Monster, Fireball, Enemy, Spawn} from '../entities'
import {has, whereProp, hasThree} from '../predicates'
import {findWhere} from '../query'
import {withClock} from '../tasks'
import {doesCollide} from '../physics'
import {remove, propLessThan, both, either, instanceOf, all} from '../utils'
import {updateGamepadState} from '../input/gamepad'

const isPlayer = instanceOf(Monster)
const isFireball = instanceOf(Fireball)
const isEnemy = instanceOf(Enemy)
const {abs, round, sin, cos} = Math
const BUTTONS = {
  UP: 12,
  RIGHT: 15,
  DOWN: 13,
  LEFT: 14,
  A: 0,
  B: 1
}
const KEYS = {
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  LEFT: 37,
  F: 70,
  SPACE: 32
}

function * checkWinningCondition (state) {
  const {game} = state
  const {gameover} = state.sounds

  while (true) {
    if (state.player.dead) {
      game.state = game.states[2]
      gameover.play()
    }
    yield 
  }
}

function * updateAABBs (state) {
  const query = has('aabb')

  while (true) {
    const {fg} = state

    for (let e of findWhere(query, fg)) {
      e.aabb.position.x = e.worldTransform.tx 
      e.aabb.position.y = e.worldTransform.ty
      e.aabb.size.x = e.width
      e.aabb.size.y = e.height
    }
    yield 
  }
}

function * getColliderPairs (root) {
  let query1 = both(has('aabb'), whereProp('dying', false))

  for (let e1 of findWhere(query1, root)) {
    let query2 = both(query1, propLessThan('id', e1))

    for (let e2 of findWhere(query2, root)) {
      if (doesCollide(e1.aabb, e2.aabb)) yield([e1, e2])
    }
  }
}

function * killSequence (state, entity) {
  const {death} = state.sounds

  entity.dying = true
  entity.alpha = 0.5
  entity.doPhysics = false
  death.play()

  let waitTimer = 0

  while (waitTimer++ < 15) yield

  entity.velocity.y = -40
  entity.velocity.x = 0
  entity.doPhysics = true

  let flyTimer = 0

  while (flyTimer++ < 30) {
    entity.scale.x += 0.01
    entity.scale.y += 0.01
    entity.rotation += 0.5
    yield
  }

  entity.dead = true
}

function * checkCollisions (state) {
  while (true) {
    let {fg, tasks} = state 

    for (let [e1, e2] of getColliderPairs(fg)) {
      if (either(isPlayer, isEnemy, e1, e2)) {
        tasks.push(killSequence(state, e1))
        tasks.push(killSequence(state, e2))
      }
    }
    yield
  }
}

function * doPhysics (state) {
  const query = all(
    has('position'), 
    has('velocity'), 
    has('acceleration'), 
    whereProp('doPhysics', true))

  while (true) {
    let {game, fg, world} = state 
    let {dT} = game.clock

    for (let e of findWhere(query, fg)) {
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
    let {game, fg} = state 
    let {thisTime} = game.clock
    let query = (e) => e.deathTime < thisTime

    for (let e of findWhere(query, fg)) state.fg.removeChild(e)
    yield
  }
}

function * processInput (state) {
  var clock = 0

  while (true) {
    const {player, fg, world, game} = state
    const {isDowns : downKeys} = game.inputs.keyboard
    const {isDowns : downButtons} = game.inputs.gamepads[0]
    const {fireball} = state.sounds
    let xVel = 0
    let yVel = player.velocity.y

    if (downButtons[BUTTONS.LEFT] || downKeys[KEYS.LEFT]) {
      player.scale.x = 1.0
      xVel -= player.walkSpeed
    }
    if (downButtons[BUTTONS.RIGHT] || downKeys[KEYS.RIGHT]) {
      player.scale.x = -1.0
      xVel += player.walkSpeed
    }
    if (downButtons[BUTTONS.A] || downKeys[KEYS.F]) {
      if (player.nextFireTime < clock) {
        let scalar = player.scale.x < 0 ? 1 : -1
        let x = player.position.x + scalar * 20
        let y = player.position.y
        let fb = new Fireball({x, y}, clock)


        fireball.play()
        fb.velocity.y = -15
        fb.velocity.x = scalar * 20
        player.nextFireTime = clock + player.fireballTimeout
        state.fg.addChild(fb)
      }
    }
    if (downButtons[BUTTONS.B] || downKeys[KEYS.SPACE]) {
      if (player.position.y >= world.y - (player.height / 2)) {
        yVel -= 40
      }
    }
    player.velocity.x = xVel
    player.velocity.y = yVel
    clock++
    yield
  }
}
function *drawDebug ({fg, debug}) {
  while (true) {
    debug.clear()
    debug.lineStyle(2, 0x0000FF, 0.50)
    debug.beginFill(0xFF700B, 0.50)
    for (let e of findWhere(has('aabb'), fg)) {
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
  let debug = new Pixi.Graphics
  let sounds = {
    fireball: new Howl({urls: ['mp3s/fireball.mp3']}), 
    death: new Howl({urls: ['mp3s/death.mp3']}), 
    gameover: new Howl({urls: ['mp3s/gameover.mp3']})
  }

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
  this.ui = ui
  this.fg = fg
  this.bg = bg
  this.debug = debug
  this.sounds = sounds
  this.stage.addChild(bg)
  this.stage.addChild(fg)
  this.stage.addChild(ui)
  this.player = m
}
