# Changelog for Procmonrest

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2021-03-17

### Changed

* Instead of using `__dirname` as its working directory, the spawned child process now uses `process.cwd()`.
* The `command` option in the constructor is no longer required. If missing, it will default to `npm start`.

### Fixed

* When checking the `stdout` of the child process for the expected characters, the presence of blank lines was causing a problem in some situations. This is now fixed.

## [0.1.0] - 2021-03-15

First release.
