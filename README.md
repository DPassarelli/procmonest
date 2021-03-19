# Procmonrest

[![Linux Build Status](https://img.shields.io/travis/DPassarelli/procmonrest/master?label=Linux%20build&logo=travis)](https://travis-ci.com/DPassarelli/procmonrest)
[![Windows Build Status](https://img.shields.io/appveyor/build/DPassarelli/procmonrest/master?label=Windows%20build&logo=appveyor)](https://ci.appveyor.com/project/DPassarelli/procmonrest?branch=master)
[![Coverage Status](https://img.shields.io/coveralls/github/DPassarelli/procmonrest/master?logo=coveralls)](https://coveralls.io/github/DPassarelli/procmonrest?branch=master)

**A promise-based child process monitor to ensure reliable testing of local servers written in JS.**

This project adheres to the `standard` coding style (click below for more information):

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard#javascript-standard-style)

## _Raison d'être_

I wanted to create a set of reliable, end-to-end tests for a REST API that I was working on. In order to do this, I decided to write some code that would start up the server in an entirely separate process, and monitor its `stdout` to see when it was ready to accept requests. This worked out so well that I started replicating the code across projects, and, of course, that's when it should become an npm module.

## Getting started

Install via [NPM](https://docs.npmjs.com/downloading-and-installing-packages-locally):

    npm install procmonrest --save-dev

Or [Yarn](https://yarnpkg.com/getting-started/usage#adding-a-dependency):

    yarn add procmonrest --dev

Then create a new instance of `Procmonrest` and wait for the `start()` method to resolve before running your tests. Afterwards, wait for the `stop()` method to resolve before continuing on to the next test suite, or the next step in your build process.

For example (using [mocha](https://mochajs.org)):

```js
import Procmonrest from 'procmonrest' // or const Procmonrest = require('procmonrest')

describe('an end-to-end test', function () {
  const serverProcess = new Procmonrest({
      command: 'node .',
      waitFor: /listening on port \d{4}/i
    })

  before(() => {
    return serverProcess.start()
  })

  after(() => {
    return serverProcess.stop()
  })

  ...
})
```

## Be careful!

You can create as many separate instances of `Procmonrest` as you like; however, keep in mind that you will not be able to run multiple copies of the same child process if they are all competing for the same system resources. For example, you will not be able to run more than one HTTP server locally if they all attempt to listen on the same TCP port. 

Therefore, you should carefully plan where in the test suite you will call `start()` and `stop()` in order to avoid resource contention.

## Documentation

Instances of `Procmonrest` must be created using the `new` keyword. 

### Constructor options

| Key | Type | Value |
|-----|------|-------|
| `command` | {String?} | The command to run as a separate process (typically whatever is used to start the local server). Defaults to `npm start`. |
| `waitFor` | {RegExp} | A [regular expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions) that each line of output from the child process will be tested against. As soon as a match is made, then the process will be considered "ready for testing". | 

### Properties

#### `running` {Boolean}

Returns `true` when the child process has started and is ready to be tested.

### Methods

#### `start` returns {Promise}

This spawns the child process and resolves once the specified pattern is matched in the child process's `stdout`. The promise will be rejected if an error is thrown in the meantime.

#### `stop` returns {Promise}

This method calls [tree-kill](https://www.npmjs.com/package/tree-kill) on the child process. On MS Windows, this will forcefully terminate the process. On macOS and Linux, it will send a `SIGTERM` signal. The promise will be rejected if the child process is not running.

## Safety features

In order to avoid any misuse (whether intentional or not), the current working directory is set to the folder containing the parent project's `package.json` file.

## License

Please refer to `LICENSE`.
