# Changelog for Procmonrest

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0]

### Added

* The `saveLogTo` option can still be used to specify the location of the log file; however, it will now default to the same location as the file that calls `new Procmonrest()`.


## [1.0.0] - 2021-04-06

### Added

* All output from the spawned child's `stdout` and `stderr` can be saved to a log file.

### Changed

* The `running` property is now called `isRunning`.


## [0.3.0] - 2021-03-18

### Added

* The `stop()` method will be rejected if the process already exited (or was not started to begin with).
* The `running` property can be used to check the current state of the child process.

### Changed

* The `stop()` method no longer resolves to the exit code of the child process. I was not able to get this to work, and decided it was not a significant feature. 


## [0.2.0] - 2021-03-17

### Changed

* Instead of using `__dirname` as its working directory, the spawned child process now uses `process.cwd()`.
* The `command` option in the constructor is no longer required. If missing, it will default to `npm start`.

### Fixed

* When checking the `stdout` of the child process for the expected characters, the presence of blank lines was causing a problem in some situations. This is now fixed.


## [0.1.0] - 2021-03-15

First release.
