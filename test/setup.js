const path = require('path')

const chai = require('chai')
global.expect = chai.expect

chai.use(require('chai-as-promised'))

global.scriptCommands = {
  /**
   * [noError description]
   */
  runsNormally: `node ${path.join(__dirname, './scripts/sample.js')}`,

  /**
   * [noError description]
   */
  exitsEarly: `node ${path.join(__dirname, './scripts/error.js')}`
}
