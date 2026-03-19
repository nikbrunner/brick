# Changelog

## [0.3.0](https://github.com/black-atom-industries/shiplog/compare/v0.2.0...v0.3.0) (2026-03-18)


### ⚠ BREAKING CHANGES

* update all documentation for shiplog rename
* update project config for shiplog rename
* rename brick to shiplog in source and tests
* **config:** migrate from YAML to TOML with snake_case keys

### build

* update project config for shiplog rename ([cc08a2d](https://github.com/black-atom-industries/shiplog/commit/cc08a2db5f23577d8f8d392bf45ded72439452ce))


### Features

* **config:** migrate from YAML to TOML with snake_case keys ([7a41ced](https://github.com/black-atom-industries/shiplog/commit/7a41ced8fb2f097e7eaaef428112c595fd37065e))
* **ui:** add configurable scope selector with custom override ([09af263](https://github.com/black-atom-industries/shiplog/commit/09af263df8ad4a011ffae638341cca18954277af))


### Documentation

* update all documentation for shiplog rename ([0cf4417](https://github.com/black-atom-industries/shiplog/commit/0cf441735b07e26e9bbb7937e5b644cc3c8097d7))


### Refactors

* rename brick to shiplog in source and tests ([964b4e8](https://github.com/black-atom-industries/shiplog/commit/964b4e818a33496fa0d96e7f5bb670633b074ded))

## [0.2.0](https://github.com/black-atom-industries/shiplog/compare/v0.1.0...v0.2.0) (2026-03-13)


### Features

* **commit:** wire guided builder as default commit flow ([f263fac](https://github.com/nikbrunner/brick/commit/f263fac77294dbf4c8ad4df03b285ac90179e0b5))
* **config:** add useLazygit and commitTypes to RepoConfigSchema ([405fab1](https://github.com/nikbrunner/brick/commit/405fab1397909e223244acc97bb4c3b4fa0e0187))
* **ui:** add buildCommitMessage pure function with tests ([78283e0](https://github.com/nikbrunner/brick/commit/78283e08e09428b9b22fe66d4b799559a0e636de))
* **ui:** add runGuidedCommit interactive flow ([420f6d5](https://github.com/nikbrunner/brick/commit/420f6d55d922a876d15c0392da88fcd3e74862b5))
* **ui:** enable search/filter on commit type selector ([3871dfb](https://github.com/nikbrunner/brick/commit/3871dfbd23386e1ca715a5f8830b016c19d23c25))


### Bug Fixes

* **ui:** handle Ctrl+C gracefully in guided commit flow ([0b68615](https://github.com/nikbrunner/brick/commit/0b686150cc5c28deeb088b16e2016321b099ce98))
* **ui:** re-prompt on empty subject instead of exiting ([171c5b2](https://github.com/nikbrunner/brick/commit/171c5b2e7bffd264e8895116ee079c13834d3013))


### Documentation

* add commit builder implementation plan ([3841560](https://github.com/nikbrunner/brick/commit/38415603a5e40e8833064d05dc0f2846a78f2b0f))
* add LLM support section to README ([25775d7](https://github.com/nikbrunner/brick/commit/25775d7adf9fc5cf59ba55cf3735395a43680273))
* update README and init template for commit builder ([9d79499](https://github.com/nikbrunner/brick/commit/9d79499d12e620b9146c63f8b3f4f591bac4d6d8))
* update README title and tagline ([0b0769c](https://github.com/nikbrunner/brick/commit/0b0769c79d67fcd885f2b73ba8df0d9b5fc020e6))


### Refactors

* **ui:** extract openInEditor from editMessage ([29339d2](https://github.com/nikbrunner/brick/commit/29339d2bcfda17d53d23bf70d3193eda25fcdedc))
