'use strict'

import Pixi from 'pixi.js'
import Clock from './Clock'
import {runTasksForState, tickClock} from './tasks'
import {Game, update, render} from './core'
import World from './World'
import Intro from './states/Intro'
import Main from './states/Main'
import GameOver from './states/GameOver'

const world = new World(640, 480)
const renderer = new Pixi.WebGLRenderer(world.width, world.height)
const clock = new Clock
const intro = new Intro
const main = new Main
const gameOver = new GameOver
const tasks = []
const game = new Game(clock, [intro, main, gameOver], tasks)

game.tasks.push(tickClock(game.clock, Date.now()))
game.tasks.push(runTasksForState(game))
game.state = main
document.body.appendChild(renderer.view)
setInterval(() => update(game), 33)
render(renderer, game)
