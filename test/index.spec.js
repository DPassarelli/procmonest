/* eslint-env mocha */

/**
 * The code under test.
 * @type {any}
 */
const T = require('../index.js')

describe('the Procmonest module', () => {
  it('must export a class', () => {
    expect(() => {
      const instance = new T() /* eslint-disable-line no-unused-vars */
    }).to.not.throw(/T is not a constructor/)
  })

  describe('the exported class', () => {})
})
