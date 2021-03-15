class Procmonrest {
  constructor (options) {
    if (options == null) {
      throw new Error('The constructor for Procmonrest takes an options object with a required value for "waitFor".')
    }
  }
}

module.exports = Procmonrest
