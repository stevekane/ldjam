'use strict'

const KEY_COUNT = 256

export function KeyboardState () {
  this.isDowns = new Array(KEY_COUNT) 
  this.justDowns = new Array(KEY_COUNT) 
  this.justUps = new Array(KEY_COUNT) 
  this.downDurations = new Array(KEY_COUNT) 
}

export function * updateKeyboardState ({justDowns, justUps, isDowns, downDurations}) {
  function handleKeyDown ({keyCode}) {
    justDowns[keyCode] = !isDowns[keyCode]
    isDowns[keyCode] = true
  }

  function handleKeyUp ({keyCode}) {
    justUps[keyCode] = true
    isDowns[keyCode] = false
  }

  function handleBlur () {
    var i = -1

    while (++i < KEY_COUNT) {
      isDowns[i] = false
      justDowns[i] = false
      justUps[i] = false
    }
  }
  
  const keydownListener = document.addEventListener('keydown', handleKeyDown)
  const keyupListener = document.addEventListener('keyup', handleKeyUp)
  const blurListener = document.addEventListener('blur', handleBlur)

  while (true) {
    let i = -1

    while (++i < KEY_COUNT) {
      justDowns[i] = false 
      justUps[i]   = false
      if (isDowns[i]) downDurations[i]++
      else            downDurations[i] = 0
    }
    yield
  }

  document.removeEventListener(keydownListener)
  document.removeEventListener(keyupListener)
  document.removeEventListener(blurListener)
}
