'use strict'

export function * runTasksForState (game) {
  while (true) {
    runTasks(game.state.tasks)
    yield
  }
}

export function * withClock (fn, clock, task) {
  while (!fn(clock) || !task.next().done) yield
}

export function runTasks (tasks) {
  var i = 0

  while ( i < tasks.length ) {
    let task = tasks[i] 
    let run = task.next()

    if (run.done) tasks.splice(i, 1)
    else          i++
  }
}
