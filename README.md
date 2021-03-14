# Procrunest

[![Linux Build Status](https://img.shields.io/travis/DPassarelli/procrunest/master?label=Linux%20build&logo=travis)](https://travis-ci.com/DPassarelli/procrunest)
[![Windows Build Status](https://img.shields.io/appveyor/build/DPassarelli/procrunest/master?label=Windows%20build&logo=appveyor)](https://ci.appveyor.com/project/DPassarelli/procrunest?branch=master)
[![Coverage Status](https://img.shields.io/coveralls/github/DPassarelli/procrunest/master?logo=coveralls)](https://coveralls.io/github/DPassarelli/procrunest?branch=master)

**A promise-based child process runner to ensure reliable testing of local servers written in JS.**

This project adheres to the `standard` coding style (click below for more information):

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard#javascript-standard-style)

## _Raison d'être_

I wanted to create a set of reliable, end-to-end tests for a REST API that I was working on. In order to do this, I decided to spin up the server as a child process and wait until it was ready to accept requests. This worked out so well that I started replicating the code across projects, and, of course, that is the exact moment when it should become an npm module.

## Getting started

Install via [NPM](https://docs.npmjs.com/downloading-and-installing-packages-locally):

    npm install @dpassarelli/procrunest --save-dev

Or [Yarn](https://yarnpkg.com/getting-started/usage#adding-a-dependency):

    yarn add @dpassarelli/procrunest --dev

Then create a new instance of `Procrunest` and wait for the `start()` method to resolve before running your tests. Afterwards, wait for the `stop()` method to resolve before continuing on to the next test suite, or the next step in your build process.

For example (using [mocha](https://mochajs.org)):

```js
import Procrunest from '@dpassarelli/procrunest' // or const Procrunest = require('@dpassarelli/procrunest')

describe('an end-to-end test', function () {
  const serverProcess = new Procrunest({
    triggers: {
      started: /listening on port \d{4}/
    }
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

You can create as many separate instances of `Procrunest` as you like; however, keep in mind that you will not be able to run multiple copies of the same child process if they are all competing for the same system resources. For example, you will not be able to run more than one HTTP server locally if they all attempt to listen on the same TCP port. 

Therefore, you should carefully plan where in the test suite you will call `start()` and `stop()` in order to avoid resource contention.

## Documentation

Instances of `Procrunest` must be created using the `new` keyword. 

### Constructor options

## License

Please refer to `LICENSE`.
