'use strict'

import Pixi from 'pixi.js'
import GameState from '../GameState'

const {sin, min} = Math

function * checkForController (state) {
  while (true) {
    yield
    let gps = navigator.getGamepads() 

    state.readyToPlay = !!gps[0] && gps[0].connected
  }
}

function * updateUI (state) {
  while (true) {
    yield 
    let {controllerStatus, titleText} = state.uiIndex
    let {thisTime} = state.game.clock
    
    titleText.scale.x = 1 - (Math.sin(thisTime / 300) * 0.1)
    titleText.scale.y = 1 - (Math.sin(thisTime / 300) * 0.1)
    controllerStatus.text = state.readyToPlay 
      ? 'Press any button to play' 
      : 'Please connect a controller'
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
      if (button.pressed) game.state = game.states[1]
    }
  }
}

export default function Intro () {
  let tasks = [
    checkForController(this),
    listenForButtonPress(this),
    updateUI(this)
  ]
  let uiIndex = {
    controllerStatus: new Pixi.Text('disconnected', {fill: '#ffffff'}),
    titleText: new Pixi.Text('The Title', {font: 'bold 60px Arial', fill: '#ffffff'})
  }
  let ui = new Pixi.Container


  uiIndex.titleText.anchor.x = 0.5
  uiIndex.titleText.anchor.y = 0.5
  uiIndex.titleText.position.x = 320
  uiIndex.titleText.position.y = 200
  uiIndex.controllerStatus.anchor.x = 0.5
  uiIndex.controllerStatus.anchor.y = 0.5
  uiIndex.controllerStatus.position.x = uiIndex.titleText.position.x
  uiIndex.controllerStatus.position.y = uiIndex.titleText.position.y + 100
  ui.zPosition = 10
  ui.addChild(uiIndex.controllerStatus)
  ui.addChild(uiIndex.titleText)

  GameState.call(this, 'intro', tasks)
  this.uiIndex = uiIndex
  this.readyToPlay = false
  this.stage.addChild(ui)
}

