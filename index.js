const childProcess = require('child_process')

const debug = require('debug')('procmonrest')
const terminate = require('tree-kill')

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
    let sb = null

    return new Promise((resolve, reject) => {
      const privateData = _.get(this)

      /**
       * The directory that the child process will be executed in.
       * @type {String}
       */
      const workingDirectory = process.cwd()

      debug('attempting to start cmd "%s" with cwd "%s"', privateData.cmd, workingDirectory)

      sb = childProcess.spawn(
        privateData.cmd,
        {
          cwd: workingDirectory,
          shell: true,
          stdio: 'pipe'
        }
      )

      sb.stdout.on('data', (data) => {
        const lines = data.toString().split(/\r?\n/).filter(line => line.length > 0)

        debug('STDOUT: %o', lines)

        lines.forEach((line) => {
          if (privateData.pattern.test(line)) {
            debug('process is ready!')
            resolve()
          }
        })
      })

      sb.stderr.on('data', (data) => {
        const lines = data.toString().split(/\r?\n/).filter(line => line.length > 0)
        debug('STDERR: %o', lines)
      })

      // sb.once('exit', (code) => {
      //   if (code > 0) {
      //     const msg = `The process unexpectedly exited with code ${code}`
      //     debug(msg)
      //     reject(new Error(msg))
      //   }
      // })

      privateData.subProcess = sb
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

    if (privateData && privateData.subProcess) {
      return new Promise((resolve) => {
        terminate(privateData.subProcess.pid, () => { resolve() })
      })
    }

    return Promise.reject(new Error('There is no process to stop. Please call start() first.'))
  }
}

module.exports = Procmonrest
