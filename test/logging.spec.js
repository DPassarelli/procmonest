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

    after(() => {
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

  context.skip('when the value of `saveLogTo` is a valid file spec', () => {})

  context.skip('when the value of `saveLogTo` is `null`', () => {})

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
      /* eslint-enable no-unused-vars */
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

  context.skip('when given a valid path spec for the log file', () => {
    context('without a value for "reference"', () => {
      /**
       * An instance of the code under test.
       * @type {Object}
       */
      let instance = null

      /**
       * The folder that the log file will be created in.
       * @type {String}
       */
      let tempFolder = null

      before(() => {
        return fs.mkdtemp(path.join(os.tmpdir(), 'procmonrest-'))
          .then((pathspec) => {
            tempFolder = pathspec

            instance = new T({
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

      it('must create the log file', () => {
        return fs.readdir(tempFolder)
          .then((contents) => {
            expect(contents).to.have.length(1)
          })
      })

      describe('the created file', () => {
        /**
         * Information about the created log file.
         * @type {Object}
         */
        const logFile = {
          /**
           * The name (with extension) of the log file.
           * @type {String}
           */
          name: '',

          /**
           * The contents of the file, separated by newline character.
           * @type {Array}
           */
          lines: []
        }

        before(() => {
          return fs.readdir(tempFolder)
            .then((list) => {
              logFile.name = list[0]
              return fs.readFile(path.join(tempFolder, logFile.name))
            })
            .then((contents) => {
              logFile.lines = contents
                .toString()
                .split('\n')
                .map(line => line.trim()) // remove any spaces, tabs, or \r chars
                .filter(line => line.length > 0) // ignore empty lines
            })
        })

        it('must have the expected name', () => {
          const expected = 'test.log'
          const actual = logFile.name

          expect(actual).to.equal(expected)
        })

        it('must not be empty', () => {
          const minimum = 3
          const actual = logFile.lines.length

          expect(actual).to.be.at.least(minimum)
        })

        it('must contain the child process command', () => {
          const actual = logFile.lines.find(line => line.includes(global.scriptCommands.runsNormally))
          expect(actual).to.not.equal(undefined)
        })

        it('must not contain a "reference" line', () => {
          const pattern = /^reference:/i
          const actual = logFile.lines.find(line => pattern.test(line))

          expect(actual).to.equal(undefined)
        })

        it('must contain the output from stdout', () => {
          const pattern = /^stdout:\s+.+$/i
          const actual = logFile.lines.filter(line => pattern.test(line))

          expect(actual).to.have.length(2)
        })

        it('must contain the output from stderr', () => {
          const pattern = /^stderr:\s+.+$/i
          const actual = logFile.lines.filter(line => pattern.test(line))

          expect(actual).to.have.length(1)
        })

        it('must end with the exit code from the child process', () => {
          const pattern = /^exit code:\s+0$/i
          const actual = logFile.lines[logFile.lines.length - 1]

          expect(actual).to.match(pattern)
        })
      })
    })

    context('with a value for "reference"', () => {
      /**
       * An instance of the code under test.
       * @type {Object}
       */
      let instance = null

      /**
       * The folder that the log file will be created in.
       * @type {String}
       */
      let tempFolder = null

      before(() => {
        return fs.mkdtemp(path.join(os.tmpdir(), 'procmonrest-'))
          .then((pathspec) => {
            tempFolder = pathspec

            instance = new T({
              command: global.scriptCommands.runsNormally,
              waitFor: /ready/,
              saveLogTo: path.join(tempFolder, 'test.log'),
              reference: 'TEST'
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

      describe('the created file', () => {
        /**
         * Information about the created log file.
         * @type {Object}
         */
        const logFile = {
          /**
           * The name (with extension) of the log file.
           * @type {String}
           */
          name: '',

          /**
           * The contents of the file, separated by newline character.
           * @type {Array}
           */
          lines: []
        }

        before(() => {
          return fs.readdir(tempFolder)
            .then((list) => {
              logFile.name = list[0]
              return fs.readFile(path.join(tempFolder, logFile.name))
            })
            .then((contents) => {
              logFile.lines = contents
                .toString()
                .split('\n')
                .map(line => line.trim()) // remove any spaces, tabs, or \r chars
                .filter(line => line.length > 0) // ignore empty lines
            })
        })

        it('must have the expected name', () => {
          const expected = 'test.log'
          const actual = logFile.name

          expect(actual).to.equal(expected)
        })

        it('must contain a "reference" line', () => {
          const pattern = /^Reference:\s+TEST$/
          const actual = logFile.lines.find(line => pattern.test(line))

          expect(actual).to.not.equal(undefined)
        })
      })
    })

    context('when the process exits with a non-zero code', () => {
      /**
       * An instance of the code under test.
       * @type {Object}
       */
      let instance = null

      /**
       * The folder that the log file will be created in.
       * @type {String}
       */
      let tempFolder = null

      before(() => {
        return fs.mkdtemp(path.join(os.tmpdir(), 'procmonrest-'))
          .then((pathspec) => {
            tempFolder = pathspec

            instance = new T({
              command: global.scriptCommands.exitsEarly,
              waitFor: /ready/,
              saveLogTo: path.join(tempFolder, 'test.log')
            })

            return instance
              .start()
              .catch(() => {
                /**
                 * This behavior is expected, and the `catch` block is required
                 * (otherwise these tests won't complete). However, the error
                 * can--and should--be ignored.
                 */
              })
          })
      })

      after(() => {
        return rmrf(tempFolder, { force: true })
      })

      describe('the created file', () => {
        /**
         * Information about the created log file.
         * @type {Object}
         */
        const logFile = {
          /**
           * The name (with extension) of the log file.
           * @type {String}
           */
          name: '',

          /**
           * The contents of the file, separated by newline character.
           * @type {Array}
           */
          lines: []
        }

        before(() => {
          return fs.readdir(tempFolder)
            .then((list) => {
              logFile.name = list[0]
              return fs.readFile(path.join(tempFolder, logFile.name))
            })
            .then((contents) => {
              logFile.lines = contents
                .toString()
                .split('\n')
                .map(line => line.trim()) // remove any spaces, tabs, or \r chars
                .filter(line => line.length > 0) // ignore empty lines
            })
        })

        it('must end with the exit code from the child process', () => {
          const pattern = /^exit code:\s+1$/i
          const actual = logFile.lines[logFile.lines.length - 1]

          expect(actual).to.match(pattern)
        })
      })
    })

    context('when the process is forced to exit', () => {
      /**
       * An instance of the code under test.
       * @type {Object}
       */
      let instance = null

      /**
       * The folder that the log file will be created in.
       * @type {String}
       */
      let tempFolder = null

      before(() => {
        return fs.mkdtemp(path.join(os.tmpdir(), 'procmonrest-'))
          .then((pathspec) => {
            tempFolder = pathspec

            instance = new T({
              command: global.scriptCommands.doesNotExit,
              waitFor: /ready/,
              saveLogTo: path.join(tempFolder, 'test.log')
            })

            return instance
              .start()
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
                  global.setTimeout(resolve, 800) // this is needed for the final write to the log file
                })
              })
          })
      })

      after(() => {
        return rmrf(tempFolder, { force: true })
      })

      describe('the created file', () => {
        /**
         * Information about the created log file.
         * @type {Object}
         */
        const logFile = {
          /**
           * The name (with extension) of the log file.
           * @type {String}
           */
          name: '',

          /**
           * The contents of the file, separated by newline character.
           * @type {Array}
           */
          lines: []
        }

        before(() => {
          return fs.readdir(tempFolder)
            .then((list) => {
              logFile.name = list[0]
              return fs.readFile(path.join(tempFolder, logFile.name))
            })
            .then((contents) => {
              logFile.lines = contents
                .toString()
                .split('\n')
                .map(line => line.trim()) // remove any spaces, tabs, or \r chars
                .filter(line => line.length > 0) // ignore empty lines
            })
        })

        it('must end with the terminating signal', () => {
          const pattern = /^exit code:\s+sigterm$/i
          const actual = logFile.lines[logFile.lines.length - 1]

          expect(actual).to.match(pattern)
        })
      })
    })
  })
})
