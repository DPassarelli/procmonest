/* eslint-env mocha */

const path = require('path')

/**
 * The code under test.
 * @type {any}
 */
const T = require('./index.js')

/**
 * The exit code expected to be resolved from the "stop" method when the child
 * process is not running (meaning, there is nothing to stop).
 * @type {Number}
 */
const STOP_CODE_WHEN_NOT_RUNNING = -1

describe('the Procmonrest module', () => {
  /* eslint-disable no-unused-vars */
  it('must export a class', () => {
    expect(() => {
      const instance = new T()
    }).to.not.throw(/T is not a constructor/)
  })

  describe('the constructor', () => {
    const ERR_INVALID_OPTIONS = 'The constructor for Procmonrest takes an options object with a required value for "waitFor".'

    it('must throw an error if there are no options provided', () => {
      expect(() => {
        const instance = new T()
      }).to.throw(ERR_INVALID_OPTIONS)
    })

    it('must throw an error if the options are not an object', () => {
      expect(() => {
        const instance = new T('waitFor=listening')
      }).to.throw(ERR_INVALID_OPTIONS)
    })

    it('must throw an error if the options are an object but do not include "waitFor"', () => {
      expect(() => {
        const instance = new T({})
      }).to.throw(ERR_INVALID_OPTIONS)
    })

    it('must throw an error if the options are an object and include "waitFor", but it is a string', () => {
      expect(() => {
        const instance = new T({ waitFor: 'something' })
      }).to.throw(ERR_INVALID_OPTIONS)
    })

    it('must not throw an error if the options are an object and include "waitFor", and it is a valid regular expression', () => {
      expect(() => {
        const instance = new T({ waitFor: /something/ })
      }).to.not.throw(ERR_INVALID_OPTIONS)
    })
  })
  /* eslint-enable no-unused-vars */

  describe('each instance', () => {
    let instance = null

    before(() => {
      instance = new T({
        command: `node ${path.join(__dirname, 'test/commands/sample.js')}`,
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
  })

  context('when the process starts and stops normally', () => {
    let instance = null

    before(() => {
      instance = new T({
        command: `node ${path.join(__dirname, 'test/commands/sample.js')}`,
        waitFor: /ready/
      })
    })

    describe('the "start" method', () => {
      it('must be resolved if the expected output is found', () => {
        return instance.start().then(() => { return instance.stop() })
      })
    })

    describe('the "stop" method', () => {
      it('must resolve to the exit code returned by the process', () => {
        return instance
          .start()
          .then(() => {
            return instance.stop()
          })
          .then((actual) => {
            const expected = 0
            expect(actual).to.equal(expected)
          })
      })
    })
  })

  context('when the process throws an error before the expected output is found', () => {})
  context('when the process exits with a non-zero code', () => {})
  context('when the process throws an error after the terminating signal is sent', () => {})

  context('when the "stop" method is called before "start"', () => {
    describe('the value resolved from "stop"', () => {
      it('must be the expected value', () => {
        const instance = new T({
          command: `node ${path.join(__dirname, 'test/commands/sample.js')}`,
          waitFor: /ready/
        })

        const expected = STOP_CODE_WHEN_NOT_RUNNING

        return instance
          .stop()
          .then((actual) => {
            expect(actual).to.equal(expected)
          })
      })
    })
  })

  context('when the "stop" method is called more than once', () => {
    describe('the value resolved from "stop"', () => {
      it('must be the expected value', () => {
        const instance = new T({
          command: `node ${path.join(__dirname, 'test/commands/sample.js')}`,
          waitFor: /ready/
        })

        const expected = STOP_CODE_WHEN_NOT_RUNNING

        return instance
          .start()
          .then(() => {
            return instance.stop()
          })
          .then((code) => {
            return instance.stop()
          })
          .then((actual) => {
            expect(actual).to.equal(expected)
          })
      })
    })
  })
})
