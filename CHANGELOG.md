# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Changes...

## [1.2.1] - 2025-11-21
### Fixed
- Restored backward compatibility by adding multi-version support
- Major version 0 (v0.1.5) is now available alongside Major version 1 for existing pipelines
- Fixed issue where pipelines using `scanoss@0` were failing after v1.0.0 release

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
[1.2.1]: https://github.com/scanoss/ado-code-scan/compare/v1.2.0...v1.2.1