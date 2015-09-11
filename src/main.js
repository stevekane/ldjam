'use strict'

import {Howl} from 'howler'

import Pixi from 'pixi.js'
import Clock from './Clock'
import {Game, update, render} from './core'
import World from './World'
import Intro from './states/Intro'
import Main from './states/Main'
import GameOver from './states/GameOver'

const TICK_RATE = 33
const world = new World(640, 480)
const renderer = new Pixi.WebGLRenderer(world.x, world.y)
const clock = new Clock(Date.now(), TICK_RATE)
const intro = new Intro(clock)
const main = new Main(clock)
const gameOver = new GameOver(clock)
const tasks = []
const game = new Game(clock, [intro, main, gameOver], tasks)

game.state = main
game.backgroundMusic = new Howl({urls: ['mp3s/bgm1.mp3'], loop: true, volume: 0.2})
game.backgroundMusic.play()
document.body.appendChild(renderer.view)
setInterval(() => update(game), TICK_RATE)
render(renderer, game)
