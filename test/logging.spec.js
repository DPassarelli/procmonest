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

describe('the logging functionality', () => {
  context('when given a valid folder to save the log file to', () => {
    let instance = null
    let tempFolder = null

    before(() => {
      return fs.mkdtemp(path.join(os.tmpdir(), 'procmonrest-'))
        .then((pathspec) => {
          tempFolder = pathspec

          instance = new T({
            command: global.scriptCommands.runsNormally,
            waitFor: /ready/,
            saveLogTo: tempFolder
          })

          return instance.start()
        })
    })

    after(() => {
      if (instance) {
        return instance
          .stop()
          .then(() => {
            return rmrf(tempFolder, { force: true })
          })
      }

      return rmrf(tempFolder, { force: true })
    })

    it('must create the log file', () => {
      return fs.readdir(tempFolder)
        .then((contents) => {
          expect(contents).to.have.length(1)
        })
    })

    describe('the created file', () => {
      it('must have the expected name', () => {
        const pattern = /log/i

        return fs.readdir(tempFolder)
          .then((contents) => {
            const actual = contents[0]
            expect(actual).to.match(pattern)
          })
      })
    })
  })
})
