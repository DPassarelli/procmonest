const path = require('path')

const chai = require('chai')
global.expect = chai.expect

chai.use(require('chai-as-promised'))

global.scriptCommands = {
  /**
   * A script that starts, outputs the expected text to `stdout`, and then ends
   * on its own.
   */
  runsNormally: `node ${path.join(__dirname, './scripts/sample.js')}`,

  /**
   * A script that exits before outputing the expected text.
   */
  exitsEarly: `node ${path.join(__dirname, './scripts/error.js')}`,

  /**
   * A script that starts, outputs the expected text to `stdout`, but does not
   * end (meaning, it keeps the event loop running).
   */
  server: `node ${path.join(__dirname, './scripts/server.js')}`
}
