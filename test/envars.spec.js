/* eslint-env mocha */

'use strict'

const path = require('path')

const request = require('got')
const rmrf = require('del')

/**
 * The code under test.
 * @type {any}
 */
const T = require('../index.js')

/**
 * The expected error message whenever the specified environment variables are
 * not formatted correctly.
 * @type {String}
 */
const ERR_INVALID_ENVARS = 'If specified, the "envars" option must be a plain object containing only string values.'

describe('the environment variable functionality', () => {
  context('when the value of `envars` is not specified', () => {
    before(() => {
      return rmrf(path.join(__dirname, '*.log'))
    })

    it('must include NODE_ENV=test by default', () => {
      const instance = new T({
        command: global.scriptCommands.server,
        waitFor: /ready/
      })

      return instance.start()
        .then((line) => {
          const portNumber = global.parseInt(line.substr(line.lastIndexOf(' ')), 10)
          return request(`http://localhost:${portNumber}`)
        })
        .then((response) => {
          const env = global.JSON.parse(response.body)
          expect(env).to.have.property('NODE_ENV', 'test')
        })
        .finally(() => {
          return instance.stop()
        })
    })
  })

  context('when the value of `envars` is specified', () => {
    before(() => {
      return rmrf(path.join(__dirname, '*.log'))
    })

    describe('the constructor', () => {
      it('must throw an error when the value is not a plain object', () => {
        expect(() => {
          const instance = new T({ // eslint-disable-line no-unused-vars
            waitFor: /something/,
            envars: [404]
          })
        }).to.throw(ERR_INVALID_ENVARS)
      })

      it('must throw an error when the value is a plain object, but contains values that are not strings', () => {
        expect(() => {
          const instance = new T({ // eslint-disable-line no-unused-vars
            waitFor: /something/,
            envars: {
              TEST: [404]
            }
          })
        }).to.throw(ERR_INVALID_ENVARS)
      })
    })

    it('must add the specified values to the child process environment', () => {
      const expected = {
        TEST_ONE: '1',
        TEST_TWO: '2',
        TEST_THREE: '3'
      }

      const instance = new T({
        command: global.scriptCommands.server,
        waitFor: /ready/,
        envars: expected
      })

      return instance.start()
        .then((line) => {
          const portNumber = global.parseInt(line.substr(line.lastIndexOf(' ')), 10)
          return request(`http://localhost:${portNumber}`)
        })
        .then((response) => {
          const env = global.JSON.parse(response.body)
          expect(env).to.include(expected)
        })
        .finally(() => {
          return instance.stop()
        })
    })

    it('must overwrite the value of NODE_ENV (if specified)', () => {
      const expected = {
        NODE_ENV: 'production'
      }

      const instance = new T({
        command: global.scriptCommands.server,
        waitFor: /ready/,
        envars: expected
      })

      return instance.start()
        .then((line) => {
          const portNumber = global.parseInt(line.substr(line.lastIndexOf(' ')), 10)
          return request(`http://localhost:${portNumber}`)
        })
        .then((response) => {
          const env = global.JSON.parse(response.body)
          expect(env).to.include(expected)
        })
        .finally(() => {
          return instance.stop()
        })
    })
  })
})
