/* eslint-env mocha */

const { expect } = require('chai')
const path = require('path')

/**
 * The code under test.
 * @type {any}
 */
const T = require('./index.js')

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

    describe('the "start" method', () => {
      it('must return a Promise that is resolved successfully if the expected output is found', () => {
        const instance = new T({
          command: `node ${path.join(__dirname, 'test/commands/sample.js')}`,
          waitFor: /ready/
        })

        return instance.start().then(() => { return instance.stop() })
      })

      context('when the child process terminates before the expected output is found', () => {
        it.skip('must return a Promise that is rejected with the exit code', () => {
          const instance = new T({
            command: `node ${path.join(__dirname, 'test/commands/error.js')}`,
            waitFor: /ready/
          })

          const pattern = /the process unexpectedly exited with code \d+/i

          return instance
            .start()
            .catch((err) => {
              const actual = err.message
              expect(actual).to.match(pattern)
            })
        })
      })
    })
  })

  context('when the "stop" method is called before "start"', () => {
    it('must be rejected', () => {
      const instance = new T({
        command: `node ${path.join(__dirname, 'test/commands/sample.js')}`,
        waitFor: /ready/
      })

      const expected = 'There is no process to stop. Please call start() first.'

      return instance
        .stop()
        .catch((err) => {
          const actual = err.message
          expect(actual).to.equal(expected)
        })
    })
  })
})
