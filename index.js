const childProcess = require('child_process')
const fs = require('fs')
const path = require('path')

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
      pattern: options.waitFor,
      ready: false,
      ref: options.reference || null
    }

    if (options.saveLogTo) {
      try {
        privateData.log = {
          path: path.normalize(options.saveLogTo)
        }

        debug('log path set to "%s"', privateData.log.path)
      } catch (err) {
        debug('could not normalize "%s"', options.saveLogTo)
        throw new Error('If specified, the "saveLogTo" option must refer to a valid location that this proces has write-access to.')
      }
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

      if (privateData.log) {
        debug('START: creating write stream for log file "%s"', privateData.log.path)

        privateData.log.stream = fs.createWriteStream(privateData.log.path)
        privateData.log.stream.write('************************************\n')
        privateData.log.stream.write('*      STDOUT/STDERR LOG FILE      *\n')
        privateData.log.stream.write('************************************\n')
        privateData.log.stream.write(`Command:     ${privateData.cmd}\n`)

        if (privateData.ref) {
          privateData.log.stream.write(`Reference:   ${privateData.ref}\n`)
        }

        privateData.log.stream.write('\n') // whitespace for readability
      }

      debug('START: attempting to start cmd "%s" with cwd "%s"', privateData.cmd, workingDirectory)
      debug('START: waiting for output to match %o', privateData.pattern)

      sb = childProcess.spawn(
        privateData.cmd,
        {
          cwd: workingDirectory,
          shell: true,
          stdio: 'pipe'
        }
      )

      sb.stdout.on('data', (data) => {
        const lines = data
          .toString()
          .split(/\r?\n/)
          .filter(line => line.length > 0)

        lines.forEach((line) => {
          if (privateData.log) {
            privateData.log.stream.write(`STDOUT: ${line}\n`)
          }

          if (!privateData.ready && privateData.pattern.test(line)) {
            debug('START: process is ready!')
            privateData.ready = true
            resolve()
          }
        })
      })

      sb.stderr.on('data', (data) => {
        if (privateData.log) {
          data
            .toString()
            .split(/\r?\n/)
            .filter(line => line.length > 0)
            .forEach(line => privateData.log.stream.write(`STDERR: ${line}\n`))
        }
      })

      sb.once('exit', (code, signal) => {
        if (!privateData.ready) {
          const err = new Error('The process exited before indicating that it was ready for testing')
          err.exitCode = code

          debug('START:', err.message.toLowerCase())
          reject(err)
        }

        if (privateData.log && privateData.log.stream) {
          // code may be 0 (which is a valid exit code), so do not evaluate that first
          privateData.log.stream.write(`EXIT CODE: ${signal || code}\n`)
          privateData.log.stream.end()
        }

        privateData.ready = false
        privateData.subProcess = null
      })

      privateData.subProcess = sb
    })
  }

  /**
   * A flag indicating whether the child process is currently running.
   *
   * @return {Boolean}
   */
  get isRunning () {
    return _.get(this).ready
  }

  /**
   * Sends a signal to terminate the child process. Resolves when complete.
   *
   * @return {Promise}
   */
  stop () {
    const privateData = _.get(this)

    if (privateData && privateData.subProcess) {
      return new Promise((resolve, reject) => {
        debug('STOP: attempting to terminate process with id %d...', privateData.subProcess.pid)

        terminate(privateData.subProcess.pid, (err) => {
          privateData.ready = false
          privateData.subProcess = null

          if (err) {
            const patternForMissingProcessId = /the process "\d+" not found/i

            if (patternForMissingProcessId.test(err.message)) {
              debug('STOP: ...process was not found')
              reject(new Error('There is nothing to stop. Please call start() first.'))
            } else {
              debug('STOP: ...an error occurred ->', err.message)
              reject(err)
            }

            return
          }

          debug('STOP: ...done!')
          resolve()
        })
      })
    }

    debug('STOP: process has not started')
    return Promise.reject(new Error('There is nothing to stop. Please call start() first.'))
  }
}

module.exports = Procmonrest
