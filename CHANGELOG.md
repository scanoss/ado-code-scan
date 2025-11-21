# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.0] - 2025-11-21
### Changed
- Updated copyleft policy check to read results from generated markdown files (`copyleft-details.md` and `copyleft-summary.md`)
- Updated undeclared policy check to read results from generated markdown files (`undeclared-details.md` and `undeclared-summary.md`)
- Added `instanceNameFormat` to the task.json file
- Set default thread PR comment status to `active`
### Fixed
- Fixed repeated comments for policy checks

## [1.2.0] - 2025-11-7
### Added
- Added dependency track integration
### Changed
- Upgraded scanoss-py version to v1.40.1

## [1.1.0] - 2025-10-22
### Added
- Added raw results conversion to CycloneDX, SPDXLite and CSV
### Changed
- Upgraded scanoss-py version to v1.37.1

[1.1.0]: https://github.com/scanoss/ado-code-scan/compare/v1.0.3...v1.1.0
[1.2.0]: https://github.com/scanoss/ado-code-scan/compare/v1.1.0...v1.2.0
[1.3.0]: https://github.com/scanoss/ado-code-scan/compare/v1.2.0...v1.3.0