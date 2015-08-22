'use strict'

import {runTasks} from './tasks'

export function Game (clock, states, tasks) {
  this.clock = clock
  this.states = states
  this.state = states[0]
  this.tasks = tasks
  for (let state of states) state.game = this
}

export function update (game) {
  runTasks(game.tasks)
}

export function render (renderer, game) {
  requestAnimationFrame(innerRender)
  function innerRender () {
    renderer.render(game.state.stage)
    requestAnimationFrame(innerRender)
  }
}
