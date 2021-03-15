/* eslint-env mocha */

const path = require('path')

/**
 * The code under test.
 * @type {any}
 */
const T = require('../index.js')

describe('the Procmonrest module', () => {
  it('must export a class', () => {
    expect(() => {
      const instance = new T() /* eslint-disable-line no-unused-vars */
    }).to.not.throw(/T is not a constructor/)
  })

  describe('the constructor', () => {
    const ERR_INVALID_OPTIONS = 'The constructor for Procmonrest takes an options object with a required value for "waitFor".'

    it('must throw an error if there are no options provided', () => {
      expect(() => {
        const instance = new T() /* eslint-disable-line no-unused-vars */
      }).to.throw(ERR_INVALID_OPTIONS)
    })

    it('must throw an error if the options are not an object', () => {
      expect(() => {
        const instance = new T('waitFor=listening') /* eslint-disable-line no-unused-vars */
      }).to.throw(ERR_INVALID_OPTIONS)
    })

    it('must throw an error if the options are an object but do not include "waitFor"', () => {
      expect(() => {
        const instance = new T({}) /* eslint-disable-line no-unused-vars */
      }).to.throw(ERR_INVALID_OPTIONS)
    })

    it('must throw an error if the options are an object and include "waitFor", but it is a string', () => {
      expect(() => {
        const instance = new T({ waitFor: 'something' }) /* eslint-disable-line no-unused-vars */
      }).to.throw(ERR_INVALID_OPTIONS)
    })

    it('must not throw an error if the options are an object and include "waitFor", and it is a valid regular expression', () => {
      expect(() => {
        const instance = new T({ waitFor: /something/ }) /* eslint-disable-line no-unused-vars */
      }).to.not.throw(ERR_INVALID_OPTIONS)
    })
  })

  describe('each instance', () => {
    let instance = null

    beforeEach(() => {
      instance = new T({
        command: `node ${path.join(__dirname, 'commands/sample.js')}`,
        waitFor: /ready/
      })
    })

    it('must have a method named "start"', () => {
      const expected = 'function'
      const actual = typeof instance.start

      expect(actual).to.equal(expected)
    })

    it('must have a method named "stop"', () => {
      const expected = 'function'
      const actual = typeof instance.stop

      expect(actual).to.equal(expected)
    })

    describe('the "start" method', () => {
      it('must be resolved when the expected output is found', () => {
        return instance.start().then(() => { return instance.stop() })
      })
    })
  })
})
