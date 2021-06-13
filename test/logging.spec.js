/* eslint-env mocha */

'use strict'

const fs = require('fs').promises
const os = require('os')
const path = require('path')

const rmrf = require('del')

/**
 * The code under test.
 * @type {any}
 */
const T = require('../index.js')

/**
 * The number of milliseconds to wait for the child process to exit on its own.
 * @type {Number}
 */
const DELAY = 800

/**
 * The expected error message whenever the log file path is malformed or cannot
 * be accessed.
 * @type {String}
 */
const ERR_INVALID_LOG_PATH = 'If specified, the "saveLogTo" option must refer to a valid location that this proces has write-access to.'

describe('the logging functionality', () => {
  context('when the value of `saveLogTo` is not specified', () => {
    before(() => {
      return rmrf(path.join(__dirname, '*.log'))
    })

    it('must be created in the same location as the test file', () => {
      const instance = new T({
        command: global.scriptCommands.runsNormally,
        waitFor: /ready/
      })

      return instance
        .start()
        .then(() => {
          return new Promise((resolve) => {
            global.setTimeout(resolve, DELAY) // wait for process to exit on its own
          })
        })
        .then(() => {
          return fs.readdir(__dirname)
        })
        .then((filenames) => {
          const actual = filenames.find((name) => /.+\.log$/.test(name))
          expect(actual).to.be.a('string')
        })
    })
  })

  context('when the value of `saveLogTo` is a valid file spec', () => {
    /**
     * The folder that the log file will be created in.
     * @type {String}
     */
    let tempFolder = null

    before(() => {
      return fs.mkdtemp(path.join(os.tmpdir(), 'procmonrest-'))
        .then((pathspec) => {
          tempFolder = pathspec

          const instance = new T({
            command: global.scriptCommands.runsNormally,
            waitFor: /ready/,
            saveLogTo: path.join(tempFolder, 'test.log')
          })

          return instance
            .start()
            .then(() => {
              return new Promise((resolve) => {
                global.setTimeout(resolve, DELAY) // wait for process to exit on its own
              })
            })
        })
    })

    after(() => {
      return rmrf(tempFolder, { force: true })
    })

    it('must be created in the specified location', () => {
      return fs.readdir(tempFolder)
        .then((filenames) => {
          expect(filenames).to.include('test.log')
        })
    })
  })

  context('when the value of `saveLogTo` is `null`', () => {
    before(() => {
      return rmrf(path.join(__dirname, '*.log'))
        .then(() => {
          const instance = new T({
            command: global.scriptCommands.runsNormally,
            waitFor: /ready/,
            saveLogTo: null
          })

          return instance
            .start()
            .then(() => {
              return new Promise((resolve) => {
                global.setTimeout(resolve, DELAY) // wait for process to exit on its own
              })
            })
        })
    })

    it('must not create a log file at all', () => {
      return fs.readdir(__dirname)
        .then((filenames) => {
          const matchingFile = filenames.find((name) => /.+\.log$/.test(name))
          expect(matchingFile).to.be.undefined // eslint-disable-line no-unused-expressions
        })
    })
  })

  context('when the value of `saveLogTo` is `false`', () => {
    before(() => {
      return rmrf(path.join(__dirname, '*.log'))
        .then(() => {
          const instance = new T({
            command: global.scriptCommands.runsNormally,
            waitFor: /ready/,
            saveLogTo: false
          })

          return instance
            .start()
            .then(() => {
              return new Promise((resolve) => {
                global.setTimeout(resolve, DELAY) // wait for process to exit on its own
              })
            })
        })
    })

    it('must not create a log file at all', () => {
      return fs.readdir(__dirname)
        .then((filenames) => {
          const matchingFile = filenames.find((name) => /.+\.log$/.test(name))
          expect(matchingFile).to.be.undefined // eslint-disable-line no-unused-expressions
        })
    })
  })

  context('when the value of `saveLogTo` is not a string', () => {
    describe('the constructor', () => {
      it('must throw an error', () => {
        expect(() => {
          const instance = new T({ // eslint-disable-line no-unused-vars
            waitFor: /something/,
            saveLogTo: [404]
          })
        }).to.throw(ERR_INVALID_LOG_PATH)
      })
    })
  })

  context('when the value of `saveLogTo` is a string, but does not point to a valid location', () => {
    describe('the `start` method', () => {
      it('must be rejected', () => {
        const instance = new T({
          command: global.scriptCommands.runsNormally,
          waitFor: /ready/,
          saveLogTo: '/this/path/does/not/exist/log.txt'
        })

        const promise = instance.start()

        expect(promise).to.be.rejectedWith(ERR_INVALID_LOG_PATH)
      })
    })
  })

  describe('the log file itself', () => {
    /**
     * An instance of the code under test.
     * @type {Object}
     */
    let instance = null

    /**
     * [logFileName description]
     * @type {String}
     */
    let logFileName = null

    /**
     * [fileContents description]
     * @type {String}
     */
    let logFileContents = null

    context('when the process runs normally', () => {
      before(() => {
        return rmrf(path.join(__dirname, '*.log'))
          .then(() => {
            instance = new T({
              command: global.scriptCommands.runsNormally,
              waitFor: /ready/
            })

            return instance.start()
          })
          .then(() => {
            return new Promise((resolve) => {
              global.setTimeout(resolve, DELAY) // wait for process to exit on its own
            })
          })
          .then(() => {
            return fs.readdir(__dirname)
          })
          .then((contents) => {
            logFileName = contents.find((name) => { return name.endsWith('.log') })
            return fs.readFile(path.join(__dirname, logFileName))
          })
          .then((contents) => {
            logFileContents = contents
              .toString()
              .split('\n')
              .map(line => line.trim()) // remove any spaces, tabs, or \r chars
              .filter(line => line.length > 0) // ignore empty lines
          })
      })

      it('must have the expected name', () => {
        const expected = path.basename(__filename).replace(/\.js$/i, '.log')
        const actual = logFileName

        expect(actual).to.equal(expected)
      })

      it('must not be empty', () => {
        expect(logFileContents).to.not.be.empty // eslint-disable-line no-unused-expressions
      })

      it('must contain the child process command', () => {
        const actual = logFileContents.find(line => line.includes(global.scriptCommands.runsNormally))
        expect(actual).to.not.equal(undefined)
      })

      it('must not contain a "reference" line', () => {
        const pattern = /^reference:/i
        const actual = logFileContents.find(line => pattern.test(line))

        expect(actual).to.equal(undefined)
      })

      it('must contain the output from stdout', () => {
        const pattern = /^stdout:\s+.+$/i
        const actual = logFileContents.filter(line => pattern.test(line))

        expect(actual).to.have.length(2)
      })

      it('must contain the output from stderr', () => {
        const pattern = /^stderr:\s+.+$/i
        const actual = logFileContents.filter(line => pattern.test(line))

        expect(actual).to.have.length(1)
      })

      it('must end with the exit code from the child process', () => {
        const pattern = /^exit code:\s+0$/i
        const actual = logFileContents[logFileContents.length - 1]

        expect(actual).to.match(pattern)
      })
    })

    context('when the "reference" option is specified', () => {
      before(() => {
        return rmrf(path.join(__dirname, '*.log'))
          .then(() => {
            instance = new T({
              command: global.scriptCommands.runsNormally,
              reference: 'TEST',
              waitFor: /ready/
            })

            return instance.start()
          })
          .then(() => {
            return new Promise((resolve) => {
              global.setTimeout(resolve, DELAY) // wait for process to exit on its own
            })
          })
          .then(() => {
            return fs.readdir(__dirname)
          })
          .then((contents) => {
            logFileName = contents.find((name) => { return name.endsWith('.log') })
            return fs.readFile(path.join(__dirname, logFileName))
          })
          .then((contents) => {
            logFileContents = contents
              .toString()
              .split('\n')
              .map(line => line.trim()) // remove any spaces, tabs, or \r chars
              .filter(line => line.length > 0) // ignore empty lines
          })
      })

      it('must contain a "reference" line', () => {
        const pattern = /^Reference:\s+TEST$/
        const actual = logFileContents.find(line => pattern.test(line))

        expect(actual).to.not.equal(undefined)
      })
    })

    context('when the process exits with a non-zero code', () => {
      before(() => {
        return rmrf(path.join(__dirname, '*.log'))
          .then(() => {
            instance = new T({
              command: global.scriptCommands.exitsEarly,
              waitFor: /ready/
            })

            return instance.start()
          })
          .catch(() => {
            /**
             * This behavior is expected, and the `catch` block is required
             * (otherwise these tests won't work).
             */
          })
          .then(() => {
            return fs.readdir(__dirname)
          })
          .then((contents) => {
            logFileName = contents.find((name) => { return name.endsWith('.log') })
            return fs.readFile(path.join(__dirname, logFileName))
          })
          .then((contents) => {
            logFileContents = contents
              .toString()
              .split('\n')
              .map(line => line.trim()) // remove any spaces, tabs, or \r chars
              .filter(line => line.length > 0) // ignore empty lines
          })
      })

      it('must end with the correct information', () => {
        const pattern = /^exit code:\s+1$/i
        const actual = logFileContents[logFileContents.length - 1]

        expect(actual).to.match(pattern)
      })
    })

    context('when the process is forced to exit', () => {
      before(() => {
        return rmrf(path.join(__dirname, '*.log'))
          .then(() => {
            instance = new T({
              command: global.scriptCommands.doesNotExit,
              waitFor: /ready/
            })

            return instance.start()
          })
          .then(() => {
            return new Promise((resolve) => {
              global.setTimeout(resolve, 800)
            })
          })
          .then(() => {
            return instance.stop()
          })
          .then(() => {
            return new Promise((resolve) => {
              global.setTimeout(resolve, 400) // this is needed for the final write to the log file
            })
          })
          .then(() => {
            return fs.readdir(__dirname)
          })
          .then((contents) => {
            logFileName = contents.find((name) => { return name.endsWith('.log') })
            return fs.readFile(path.join(__dirname, logFileName))
          })
          .then((contents) => {
            logFileContents = contents
              .toString()
              .split('\n')
              .map(line => line.trim()) // remove any spaces, tabs, or \r chars
              .filter(line => line.length > 0) // ignore empty lines
          })
      })

      it('must end with the correct information', () => {
        const pattern = (
          os.platform() === 'win32'
            ? /^exit code:\s+\(forcibly terminated\)$/i
            : /^exit code:\s+sigterm$/i
        )

        const actual = logFileContents[logFileContents.length - 1]

        expect(actual).to.match(pattern)
      })
    })
  })
})
