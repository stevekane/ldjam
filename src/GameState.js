'use strict'

import {Container} from 'pixi.js'

export default function GameState (name, tasks) {
  this.game = null
  this.name = name
  this.tasks = tasks
  this.stage = new Container
}
