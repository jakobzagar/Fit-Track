# Changelog

## [0.3.0](https://github.com/jakobzagar/Fit-Track/compare/v0.2.0...v0.3.0) (2026-08-21)


### Features

* add structured backend logging ([d43d1be](https://github.com/jakobzagar/Fit-Track/commit/d43d1bee37450ede2e8791733144f584e48b1102))


### Bug Fixes

* enforce workout lifecycle invariants ([74022ac](https://github.com/jakobzagar/Fit-Track/commit/74022acd2317ff069e31c6f0242dfc1b26851bed))
* harden database connection defaults ([c8fabb3](https://github.com/jakobzagar/Fit-Track/commit/c8fabb335c37e6a14bea969605c9674e0532456f))
* harden shared validation contracts ([4151125](https://github.com/jakobzagar/Fit-Track/commit/4151125133356592738937643a56bfa316b5a75d))
* keep health checks available under load ([5613245](https://github.com/jakobzagar/Fit-Track/commit/56132450a5a317d18e46abaf10ff46131bd644d1))
* validate runtime environment configuration ([4e76680](https://github.com/jakobzagar/Fit-Track/commit/4e7668044605afa39ab6f8223e30603c7f8aa071))

## [0.2.0](https://github.com/jakobzagar/Fit-Track/compare/v0.1.0...v0.2.0) (2026-08-12)


### Features

* add service health endpoints ([010ff86](https://github.com/jakobzagar/Fit-Track/commit/010ff86cc48f95d09cb57e5da40815006f18fc9a))
* gracefully shut down backend server ([5f01373](https://github.com/jakobzagar/Fit-Track/commit/5f01373f484b2e587cbe80d154ae4242d554f52f))
* proxy api through frontend origin ([e2aef3e](https://github.com/jakobzagar/Fit-Track/commit/e2aef3ed6d15dcf9d25d32c785aaefc662d7e59b))
* support workout lifecycle corrections ([7e73efc](https://github.com/jakobzagar/Fit-Track/commit/7e73efc800d01fdb65b6e7db981ba67cb982d72f))


### Bug Fixes

* allow deleting completed workouts ([99e66df](https://github.com/jakobzagar/Fit-Track/commit/99e66dfc660a3470405bc3ea9ff5ddb48bab688a))
* distinguish session restoration failures ([0b5ee8a](https://github.com/jakobzagar/Fit-Track/commit/0b5ee8a03fe4f6b343d0dd068ef7d918db85da9d))
* ignore stale frontend responses ([df47543](https://github.com/jakobzagar/Fit-Track/commit/df47543cd94be2838dca6d304ee2773989b58dab))
* preserve completed workout history ([320d379](https://github.com/jakobzagar/Fit-Track/commit/320d37964c0b999ceef292af76714a7a1c33d41f))
* preserve list ordering after mutations ([2458c39](https://github.com/jakobzagar/Fit-Track/commit/2458c39c35546d96463b7752f5c5af761002db76))
* retry prisma transaction conflicts ([af5b593](https://github.com/jakobzagar/Fit-Track/commit/af5b593633ecd729d80cbf8d6f7b7dcfc1a97628))
* return json for unknown api routes ([4d75b44](https://github.com/jakobzagar/Fit-Track/commit/4d75b4412f3c6bf724b7af8d25be6bd393aa3427))
* update vulnerable nanoid dependency ([10ed9bb](https://github.com/jakobzagar/Fit-Track/commit/10ed9bbc841d6c01af852119510d19c0b1a72e95))


### Performance Improvements

* optimize nginx asset delivery ([4e5dcfb](https://github.com/jakobzagar/Fit-Track/commit/4e5dcfb8b90c19c199a65ddd1493517233011994))

## 0.1.0 (2026-08-05)


### chore

* prepare initial release ([0227ab5](https://github.com/jakobzagar/Fit-Track/commit/0227ab5bc93a6dd06dc4d339fa5d826b5ea9c48d))


### Bug Fixes

* stabilize generated changelog ([4065bd1](https://github.com/jakobzagar/Fit-Track/commit/4065bd165a643b4a932ea74571de591235f9f353))

All notable changes to FitTrack are documented in this file by Release Please.
