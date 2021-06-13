/* eslint-env mocha */

'use strict'

/**
 * The code under test.
 * @type {any}
 */
const T = require('../index.js')

/**
 * The expected error message whenever a missing or incorrect constructor
 * option is provided.
 * @type {String}
 */
const ERR_INVALID_OPTIONS = 'The constructor for Procmonrest takes an options object with a required value for "waitFor".'

describe('the Procmonrest module', () => {
  /* eslint-disable no-unused-vars */
  it('must export a class', () => {
    expect(() => {
      const instance = new T()
    }).to.not.throw(/T is not a constructor/)
  })

  describe('the constructor', () => {
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
        command: global.scriptCommands.runsNormally,
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

    it('must have a property called "isRunning"', () => {
      expect(instance).to.have.property('isRunning')
    })
  })

  describe('the "start" method', () => {
    it('must return a Promise that is resolved successfully if the expected output is found', () => {
      const instance = new T({
        command: global.scriptCommands.runsNormally,
        waitFor: /ready/
      })

      const promise = instance.start()

      return expect(promise).to.be.fulfilled
    })

    context('when the child process terminates before the expected output is found', () => {
      let rejection = null

      before(() => {
        const instance = new T({
          command: global.scriptCommands.exitsEarly,
          waitFor: /ready/
        })

        return instance.start().catch((err) => { rejection = err })
      })

      it('must return a Promise that is rejected', () => {
        expect(rejection).to.not.equal(null)
      })

      describe('the rejection value', () => {
        it('must have the expected message', () => {
          const expected = 'The process exited before indicating that it was ready for testing'
          const actual = rejection.message

          expect(actual).to.equal(expected)
        })

        it('must have the expected exit code', () => {
          const expected = 1
          const actual = rejection.exitCode

          expect(actual).to.equal(expected)
        })
      })
    })
  })

  describe('the "isRunning" property', () => {
    let instance = null

    context('when the process runs successfully', () => {
      beforeEach(() => {
        instance = new T({
          command: global.scriptCommands.runsNormally,
          waitFor: /ready/
        })
      })

      it('must be read-only', () => {
        expect(() => {
          instance.isRunning = true
        }).to.throw('Cannot set property isRunning')
      })

      it('must be "false" by default', () => {
        const expected = false
        const actual = instance.isRunning

        expect(actual).to.equal(expected)
      })

      it('must be "true" after the process starts', () => {
        const expected = true

        return instance
          .start()
          .then(() => {
            const actual = instance.isRunning
            expect(actual).to.equal(expected)
          })
      })

      it('must be "false" after the process has been started and then stopped', () => {
        const expected = false

        return instance
          .start()
          .then(() => {
            return instance.stop()
          })
          .then(() => {
            const actual = instance.isRunning
            expect(actual).to.equal(expected)
          })
      })
    })

    context('when the process fails to start correctly', () => {
      beforeEach(() => {
        instance = new T({
          command: global.scriptCommands.exitsEarly,
          waitFor: /ready/
        })
      })

      it('must be false', () => {
        const expected = false

        return instance
          .start()
          .catch(() => {
            const actual = instance.isRunning
            expect(actual).to.equal(expected)
          })
      })
    })
  })

  context('when the "stop" method is called before "start"', () => {
    it('must be rejected', () => {
      const instance = new T({
        command: global.scriptCommands.runsNormally,
        waitFor: /ready/
      })

      const promise = instance.stop()

      return expect(promise).to.be.rejectedWith('There is nothing to stop. Please call start() first.')
    })
  })

  context('when the "stop" method is called more than once', () => {
    it('must be rejected', () => {
      const instance = new T({
        command: global.scriptCommands.runsNormally,
        waitFor: /ready/
      })

      const promise = instance
        .start()
        .then(() => {
          return instance.stop()
        })
        .then(() => {
          return instance.stop()
        })

      return expect(promise).to.be.rejectedWith('There is nothing to stop. Please call start() first.')
    })
  })

  context('when the "stop" method is called on a process that is not running', () => {
    it('must be rejected', () => {
      const instance = new T({
        command: global.scriptCommands.exitsEarly,
        waitFor: /ready/
      })

      const promise = instance
        .start()
        .catch(() => {
          return instance.stop()
        })

      return expect(promise).to.be.rejectedWith('There is nothing to stop. Please call start() first.')
    })
  })
})
