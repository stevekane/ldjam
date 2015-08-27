'use strict'

import {runTasks, runTasksForState} from './tasks'

export function Game (clock, states) {
  this.clock = clock
  this.states = states
  this.state = states[0]
  this.tasks = [
    runTasksForState(this) 
  ]
  for (let state of states) state.game = this
}

export function update (game) {
  game.clock.tick()
  runTasks(game.tasks)
}

export function render (renderer, game) {
  requestAnimationFrame(innerRender)
  function innerRender () {
    renderer.render(game.state.stage)
    requestAnimationFrame(innerRender)
  }
}
