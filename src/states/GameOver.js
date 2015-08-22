'use strict'

import Pixi from 'pixi.js'
import GameState from '../GameState'

function * updateUI (state) {
  while (true) {
    yield 
    let {gameoverText} = state.uiIndex
    let {thisTime} = state.game.clock
    
    gameoverText.scale.x = 1 - (Math.sin(thisTime / 300) * 0.1)
    gameoverText.scale.y = 1 - (Math.sin(thisTime / 300) * 0.1)
  }
}

function * listenForButtonPress ({game}) {
  while (true) {
    yield
    let pads = navigator.getGamepads()
    let controller = pads[0]

    if (!controller) continue

    for (let button of controller.buttons) {
      //TODO: have slightly better api for specifying new state
      if (button.pressed) game.state = game.states[0]
    }
  }
}

export default function GameOver () {
  let tasks = [
    updateUI(this),
    listenForButtonPress(this)
  ]
  let uiIndex = {
    gameoverText: new Pixi.Text('Game Over', {font: 'bold 60px Arial', fill: '#ffffff'}),
    pressButtonText: new Pixi.Text('Press any button to play again', {fill: '#ffffff'})
  }
  let ui = new Pixi.Container
 
  uiIndex.gameoverText.anchor.x = 0.5
  uiIndex.gameoverText.anchor.y = 0.5
  uiIndex.gameoverText.position.x = 320
  uiIndex.gameoverText.position.y = 200
  uiIndex.pressButtonText.anchor.x = 0.5
  uiIndex.pressButtonText.anchor.y = 0.5
  uiIndex.pressButtonText.position.x = uiIndex.gameoverText.position.x
  uiIndex.pressButtonText.position.y = uiIndex.gameoverText.position.y + 100
  ui.zPosition = 10
  ui.addChild(uiIndex.gameoverText)
  ui.addChild(uiIndex.pressButtonText)
  GameState.call(this, 'gameover', tasks)
  this.uiIndex = uiIndex
  this.stage.addChild(ui)
}
