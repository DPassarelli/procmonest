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

describe('the logging functionality', () => {
  context('when given a valid path spec for the log file', () => {
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
          const pattern = /^exit code: 0$/i
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
          const pattern = /^exit code: 1$/i
          const actual = logFile.lines[logFile.lines.length - 1]

          expect(actual).to.match(pattern)
        })
      })
    })
  })
})
