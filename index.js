const childProcess = require('child_process')
const debug = require('debug')('procmonrest')

/**
 * A collection of private property values for each instance of this class.
 * @type {WeakMap}
 */
const _ = new WeakMap()

class Procmonrest {
  /**
   * Options:
   *   waitFor  {RegExp}
   *
   * @constructor
   */
  constructor (options) {
    options = options || {}

    try {
      options.waitFor.test('this should fail if not a regexp')
    } catch {
      throw new Error('The constructor for Procmonrest takes an options object with a required value for "waitFor".')
    }

    const privateData = {
      cmd: options.command,
      pattern: options.waitFor
    }

    _.set(this, privateData)
  }

  /**
   * Spawns the child process. Resolves once the process outputs a line matching
   * the pattern specified by "waitFor" in the constructor.
   *
   * @return {Promise}   Resolves to undefined.
   */
  start () {
    /**
     * The child process itself.
     * @type {ChildProcess}
     */
    let proc = null

    return new Promise((resolve, reject) => {
      const privateData = _.get(this)

      /**
       * Current working directory.
       * @type {String}
       */
      let cwd = __dirname

      if (cwd.includes('node_modules/')) {
        cwd = cwd.substring(0, cwd.indexOf('node_modules/') - 1)
      }

      debug('starting command "%s" in folder "%s"', privateData.cmd, cwd)

      proc = childProcess.spawn(
        privateData.cmd,
        {
          cwd: cwd,
          shell: true,
          stdio: 'pipe'
        }
      )

      proc.stdout.on('data', (data) => {
        const lines = data.toString().split('\n')

        debug(lines)

        lines.forEach((line) => {
          if (privateData.pattern.test(line)) {
            resolve()
          }
        })
      })

      proc.on('error', (err) => {
        reject(err)
      })

      privateData.proc = proc
      _.set(this, privateData)
    })
  }

  /**
   * Sends a signal to terminate the child process. Resolves with the value of
   * the exit code.
   *
   * @return {Promise}   Resolves to an integer.
   */
  stop () {
    const privateData = _.get(this)

    debug('stopping process "%s"', privateData.cmd)

    if (privateData && privateData.proc) {
      return new Promise((resolve, reject) => {
        privateData.proc.once('exit', () => {
          debug('process exited')
          resolve()
        })

        debug('sending signal "SIGINT"')
        privateData.proc.kill('SIGINT')
      })
    }

    return Promise.resolve()
  }
}

module.exports = Procmonrest
