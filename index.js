const childProcess = require('child_process')
const debug = require('debug')('procmonrest')

/**
 * A collection of private values for each instance of this class.
 * @type {WeakMap}
 */
const _ = new WeakMap()

class Procmonrest {
  /**
   * Options:
   *   command  {String?}  The command that the child process will execute.
   *                       Defaults to `npm start`.
   *
   *   waitFor  {RegExp}   A pattern of characters that will be looked for in
   *                       the child process's stdout stream, which will
   *                       indicate that it is ready for testing.
   *
   * @constructor
   */
  constructor (options) {
    options = options || {}

    try {
      options.waitFor.test('this should fail if missing or not a regexp')
    } catch {
      throw new Error('The constructor for Procmonrest takes an options object with a required value for "waitFor".')
    }

    const privateData = {
      cmd: options.command || 'npm start',
      pattern: options.waitFor,
      signal: 'SIGINT' // this was specifically chosen for cross-platform compatibility
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
       * The directory that the child process will be executed in.
       * @type {String}
       */
      const workingDirectory = process.cwd()

      debug('starting command "%s" with working directory "%s"', privateData.cmd, workingDirectory)

      proc = childProcess.spawn(
        privateData.cmd,
        {
          cwd: workingDirectory,
          shell: true,
          stdio: 'pipe'
        }
      )

      proc.stdout.on('data', (data) => {
        const lines = data.toString().split('\n').filter(line => line.length > 0)

        debug('output from process: %o', lines)

        lines.forEach((line) => {
          if (privateData.pattern.test(line)) {
            debug('process is ready!')
            resolve()
          }
        })
      })

      proc.on('error', (err) => {
        reject(err)
      })

      privateData.proc = proc
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
        privateData.proc.once('exit', (code) => {
          debug('process exited with code %d', code)
          resolve(code)

          // after this is all done, remove from memory to allow for GC
          process.nextTick(() => {
            privateData.proc = null
          })
        })

        debug('sending termination signal %s', privateData.signal)
        privateData.proc.kill(privateData.signal)
      })
    }

    return Promise.resolve()
  }
}

module.exports = Procmonrest
