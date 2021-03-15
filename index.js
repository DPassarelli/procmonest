class Procmonrest {
  /**
   * Options:
   *   waitFor  {RegExp}
   *
   * @constructor
   */
  constructor (options) {
    options = options || {}

    try {
      options.waitFor.test('this should fail if not a regexp')
    } catch {
      throw new Error('The constructor for Procmonrest takes an options object with a required value for "waitFor".')
    }
  }

  /**
   * Spawns the child process. Resolves once the process outputs a line matching
   * the pattern specified by "waitFor" in the constructor.
   *
   * @return {Promise}   Resolves to undefined.
   */
  start () {
    return new Promise((resolve, reject) => {

    })
  }

  /**
   * Sends a signal to terminate the child process. Resolves with the value of
   * the exit code.
   *
   * @return {Promise}   Resolves to an integer.
   */
  stop () {
    return new Promise((resolve, reject) => {

    })
  }
}

module.exports = Procmonrest
