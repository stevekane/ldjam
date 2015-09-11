'use strict'

import {GamepadState, updateGamepadState} from './input/gamepad'
import {KeyboardState, updateKeyboardState} from './input/keyboard'
import {AudioSystem} from './audio'
import {runTasks, runTasksForState} from './tasks'

export function Game (clock, states) {
  this.clock = clock
  this.states = states
  this.state = states[0]
  this.audio = new AudioSystem(['music', 'main'])
  this.inputs = {
    keyboard: new KeyboardState,
    gamepads: [new GamepadState, new GamepadState, new GamepadState, new GamepadState] 
  }
  this.tasks = [
    updateGamepadState(this.inputs.gamepads),
    updateKeyboardState(this.inputs.keyboard),
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
