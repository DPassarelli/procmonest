const childProcess = require('child_process')
const fs = require('fs')
const path = require('path')

const debug = require('debug')('procmonrest')
const isPlainObject = require('is-plain-obj')
const terminate = require('tree-kill')

/**
 * A collection of private values for each instance of this class.
 * @type {WeakMap}
 */
const _ = new WeakMap()

/**
 * A shared error message for all problems related to the log file path.
 * @type {String}
 */
const INVALID_LOG_PATH = 'If specified, the "saveLogTo" option must refer to a valid location that this proces has write-access to.'

/**
 * Formats an elapsed time span for human-readable display.
 *
 * @param  {Number}   elapsedTime   The length of the duration in milliseconds.
 *
 * @return {String}
 */
function formatDuration (elapsedTime) {
  if (elapsedTime < 10000) {
    return `${Math.ceil(elapsedTime / 100) / 10}s`
  }

  if (elapsedTime < 60000) {
    return `${Math.ceil(elapsedTime / 1000)}s`
  }

  const mins = Math.floor(elapsedTime / 60000)
  const secs = Math.ceil((elapsedTime % 60000) / 1000)

  return `${mins}m ${secs}s`
}

/**
 * Returns the name of the script that created this instance of Procmonrest.
 *
 * @return {String}
 */
function getFullPathOfCaller () {
  /**
   * A regular expression for capturing the full path of the script from a line
   * in a stack trace.
   * @type {RegExp}
   */
  const patternForFilePath = /(?<pathspec>([A-Z]:\\|\/).+):\d+:\d+\)?$/i

  /**
   * A temporary object used to obtain the current stack trace.
   * @type {Error}
   */
  const err = new Error()

  /**
   * The list of lines from the stack trace, excluding the starting one (which
   * only contains the text "Error")
   * @type {Array}
   */
  const lines = err.stack.split('\n').slice(1)

  /**
   * Enumerate thru the lines of the stack trace until finding the one that
   * occurs _after_ "new Procmonrest". This is the script that called the
   * constructor.
   */
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('at new Procmonrest')) {
      // console.log(lines[i+1])
      return lines[i + 1].match(patternForFilePath).groups.pathspec
    }
  }
}

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
      env: {
        NODE_ENV: 'test'
      },
      log: false,
      pattern: options.waitFor,
      ref: options.reference
    }

    if (options.envars) {
      if (!isPlainObject(options.envars)) {
        throw new Error('If specified, the "envars" option must be a plain object containing only string values.')
      }

      Object.keys(options.envars).forEach((key) => {
        if (typeof options.envars[key] !== 'string') {
          throw new Error('If specified, the "envars" option must be a plain object containing only string values.')
        }

        privateData.env[key] = options.envars[key]
      })
    }

    if (options.saveLogTo === undefined) {
      privateData.log = {
        path: getFullPathOfCaller().replace(/\.js$/, '.log')
      }
    } else if (options.saveLogTo) {
      try {
        privateData.log = {
          path: path.normalize(options.saveLogTo)
        }
      } catch (err) {
        debug('could not normalize log path "%s"', options.saveLogTo)
        throw new Error(INVALID_LOG_PATH)
      }
    }

    if (privateData.log) {
      debug('log path set to "%s"', privateData.log.path)
    } else {
      debug('no log path set')
    }

    _.set(this, privateData)
  }

  /**
   * Spawns the child process. Resolves once the process outputs a line matching
   * the pattern specified by "waitFor" in the constructor.
   *
   * @return {Promise}   Resolves to undefined.
   */
  async start () {
    /**
     * The directory that the child process will be executed in.
     * @type {String}
     */
    const workingDirectory = process.cwd()

    /**
     * The time that the child process was started.
     * @type {Date}
     */
    const startTime = new Date()

    /**
     * Data belonging to this instance.
     * @type {Object}
     */
    const privateData = _.get(this)

    if (privateData.log) {
      await new Promise((resolve, reject) => {
        debug('START: creating write stream for log file "%s"', privateData.log.path)

        privateData.log.stream = fs.createWriteStream(privateData.log.path)

        privateData.log.stream.once('ready', resolve)

        privateData.log.stream.once('error', () => {
          reject(new Error(INVALID_LOG_PATH))
        })
      })

      privateData.log.stream.write('************************************\n')
      privateData.log.stream.write('*      STDOUT/STDERR LOG FILE      *\n')
      privateData.log.stream.write('************************************\n')
      privateData.log.stream.write(`Command:     ${privateData.cmd}\n`)
      privateData.log.stream.write(`Started at:  ${startTime.toLocaleString()}\n`)

      if (privateData.ref) {
        privateData.log.stream.write(`Reference:   ${privateData.ref}\n`)
      }

      privateData.log.stream.write('\n') // whitespace for readability
    }

    debug('START: attempting to start cmd "%s" with cwd "%s"', privateData.cmd, workingDirectory)
    debug('START: waiting for output to match %o', privateData.pattern)

    // reset flags
    privateData.ready = false
    privateData.forced = false

    privateData.subProcess = childProcess.spawn(
      privateData.cmd,
      {
        cwd: workingDirectory,
        env: privateData.env,
        shell: true,
        stdio: 'pipe'
      }
    )

    privateData.subProcess.once('spawn', () => {
      debug('START: process %d has been spawned', privateData.subProcess.pid)
    })

    return new Promise((resolve, reject) => {
      privateData.subProcess.stdout.on('data', (data) => {
        const lines = data
          .toString()
          .split(/\r?\n/)
          .filter(line => line.length > 0)

        lines.forEach((line) => {
          if (privateData.log) {
            privateData.log.stream.write(`STDOUT: ${line}\n`)
          }

          debug('STDOUT: %s', line)

          if (!privateData.ready && privateData.pattern.test(line)) {
            /**
             * The amount of time elapsed since the child process was started
             * in milliseconds.
             * @type {Number}
             */
            const elapsedTime = Date.now() - startTime.getTime()

            debug('START: process %d is ready! (%dms)', privateData.subProcess.pid, elapsedTime)

            if (privateData.log) {
              privateData.log.stream.write('\n') // whitespace for readability
              privateData.log.stream.write(`Ready in:    ${formatDuration(elapsedTime)}\n`)
              privateData.log.stream.write('\n') // whitespace for readability
            }

            privateData.ready = true
            resolve(line)
          }
        })
      })

      privateData.subProcess.stderr.on('data', (data) => {
        if (privateData.log) {
          data
            .toString()
            .split(/\r?\n/)
            .filter(line => line.length > 0)
            .forEach(line => privateData.log.stream.write(`STDERR: ${line}\n`))
        }
      })

      privateData.subProcess.once('exit', (code, signal) => {
        if (!privateData.ready) {
          const err = new Error('The process exited before indicating that it was ready for testing')
          err.exitCode = code

          debug('START:', err.message.toLowerCase())
          reject(err)
        }

        if (privateData.log) {
          privateData.log.stream.write('\n') // whitespace for readability

          if (privateData.forced && signal == null) {
            // exit code may be 0 (which is valid and should be reported), so do *not* evaluate that first
            privateData.log.stream.write('Exit code:   (forcibly terminated)\n')
          } else {
            privateData.log.stream.write(`Exit code:   ${signal || code}\n`)
          }

          privateData.log.stream.end()
        }

        privateData.subProcess = null
      })
    })
  }

  /**
   * A flag indicating whether the child process is currently running.
   *
   * @return {Boolean}
   */
  get isRunning () {
    const privateData = _.get(this)
    return (privateData.ready || false) && !privateData.forced
  }

  /**
   * Sends a signal to terminate the child process. Resolves when complete.
   *
   * @return {Promise}
   */
  async stop () {
    const privateData = _.get(this)

    if (privateData && privateData.subProcess) {
      debug('STOP: forcibly terminating process %d...', privateData.subProcess.pid)
      privateData.forced = true

      try {
        await terminate(privateData.subProcess.pid)
        debug('STOP: ...done!')
      } finally {
        privateData.subProcess = null
      }
    } else {
      debug('STOP: process has not started')
      throw new Error('There is nothing to stop. Please call start() first.')
    }
  }
}

module.exports = Procmonrest
