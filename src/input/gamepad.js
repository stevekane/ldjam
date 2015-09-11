'use strict'

const BUTTON_COUNT = 16
const GAMEPAD_COUNT = 4

export function GamepadState () {
  this.isDowns = new Array(BUTTON_COUNT)  
  this.justDowns = new Array(BUTTON_COUNT)
  this.justUps = new Array(BUTTON_COUNT)
  this.downDurations = new Array(BUTTON_COUNT)
}

export function * updateGamepadState (gamepadStates) {
  while (true) {
    const gamepads = navigator.getGamepads()
    let i = -1

    while ( ++i < GAMEPAD_COUNT ) {
      const gamepad = gamepads[i] 
      const gamepadState = gamepadStates[i]
      let j = -1

      if (!gamepad) continue

      while ( ++j < BUTTON_COUNT ) {
        const button = gamepad.buttons[j]  

        if (button.pressed) {
          const alreadyDown = gamepadState.isDowns[j]

          if (alreadyDown) gamepadState.downDurations[j]++
          else             gamepadState.downDurations[j] = 0
          gamepadState.justDowns[j] = !alreadyDown
          gamepadState.justUps[j] = false
          gamepadState.isDowns[j] = true
        } else {
          gamepadState.justUps[j] = !gamepadState.isDowns[j]
          gamepadState.isDowns[j] = false
          gamepadState.justDowns[j] = false
          gamepadState.downDurations[j] = 0
        }
      }
    }
    yield gamepadStates
  } 
}
