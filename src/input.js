'use strict'

function actionForButton (totalButtons, buttonIndex) {
  const MAX_BUTTON_COUNT = 16

  switch (buttonIndex) {
    case 0: return 'A'
    case 1: return 'B'
    default: break
  }
  switch (buttonIndex + (MAX_BUTTON_COUNT - totalButtons)) {
    case 12: return 'UP'
    case 13: return 'DOWN'
    case 14: return 'LEFT'
    case 15: return 'RIGHT'
    default: break
  }
  return null
}

export function processGamepad () {
  const controller = navigator.getGamepads()[0]
  const commands = []

  if (!controller) return

  const totalButtons = controller.buttons.length

  for (let i = 0; i < controller.buttons.length; i++) {
    if (!controller.buttons[i].pressed) continue

    let action = actionForButton(totalButtons, i)

    if (action) commands.push(action)
  }
  return commands
}

const KEY_COUNT = 256

export function KeyboardManager (document) {
  const isDowns       = new Uint8Array(KEY_COUNT)
  const justDowns     = new Uint8Array(KEY_COUNT)
  const justUps       = new Uint8Array(KEY_COUNT)
  const downDurations = new Uint32Array(KEY_COUNT)
    
  const handleKeyDown = ({keyCode}) => {
    justDowns[keyCode] = !isDowns[keyCode]
    isDowns[keyCode]   = true
  }

  const handleKeyUp = ({keyCode}) => {
    justUps[keyCode]   = true
    isDowns[keyCode]   = false
  }

  const handleBlur = () => {
    let i = -1

    while (++i < KEY_COUNT) {
      isDowns[i]   = 0
      justDowns[i] = 0
      justUps[i]   = 0
    }
  }

  this.isDowns       = isDowns
  this.justUps       = justUps
  this.justDowns     = justDowns
  this.downDurations = downDurations

  this.tick = (dT) => {
    let i = -1

    while (++i < KEY_COUNT) {
      justDowns[i] = false 
      justUps[i]   = false
      if (isDowns[i]) downDurations[i] += dT
      else            downDurations[i] = 0
    }
  }

  document.addEventListener("keydown", handleKeyDown)
  document.addEventListener("keyup", handleKeyUp)
  document.addEventListener("blur", handleBlur)
}  
