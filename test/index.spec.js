/* eslint-env mocha */

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
  })
})
