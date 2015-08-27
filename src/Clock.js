'use strict'

export default function Clock (startTime, targetInterval) {
  this.lastTime = 0
  this.thisTime = 0
  this.dT = 0
  this.tick = function () {
    this.lastTime = this.thisTime
    this.thisTime = (Date.now() - startTime) / targetInterval
    this.dT = this.thisTime - this.lastTime
  }
}
