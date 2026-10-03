# Changelog

## [0.1.0](https://github.com/jakobzagar/Fit-Track/compare/v0.0.1...v0.1.0) (2026-10-03)


### Features

* add ALB ingress and backend target group ([dd932c1](https://github.com/jakobzagar/Fit-Track/commit/dd932c1179f38d3ef66e0d6313899e1f01125dd0))
* add AWS VPC endpoints template ([d6ebd33](https://github.com/jakobzagar/Fit-Track/commit/d6ebd33d25e259df6c1520bec984720770cc6bf9))
* add backend CloudWatch log group ([9b0a125](https://github.com/jakobzagar/Fit-Track/commit/9b0a1250bf881120e1d20bca8b52a9cb41d2d0c8))
* add CloudWatch Logs VPC endpoint ([95a53ee](https://github.com/jakobzagar/Fit-Track/commit/95a53eec94b5c95d8c6e5ffc575b090485c49995))
* add ECR repositories and lifecycle policies ([a03857a](https://github.com/jakobzagar/Fit-Track/commit/a03857a3d1588fc23b99943d7079bce0b84b3380))
* add ECR repositories for Fargate deployment ([e7fe331](https://github.com/jakobzagar/Fit-Track/commit/e7fe331c4333433cc70b213229c2d4c8b823e648))
* add ECS EC2 compute stack ([8a91e02](https://github.com/jakobzagar/Fit-Track/commit/8a91e02d1fe4df3c20fca8769b9065515f1d86c5))
* add ECS service secrets and execution role ([0e48c6b](https://github.com/jakobzagar/Fit-Track/commit/0e48c6b82770882c6b3a44f0694dcdfbf9ccc6a0))
* add Fargate frontend delivery infrastructure ([ae1b362](https://github.com/jakobzagar/Fit-Track/commit/ae1b362a21fab64671b4b1d42260cec16c00eafd))
* add Fargate logs and private service endpoints ([4d585e8](https://github.com/jakobzagar/Fit-Track/commit/4d585e83d78316a3ae51dcf9cf77d2906f1844c3))
* add Fargate network and Single-AZ database ([c480559](https://github.com/jakobzagar/Fit-Track/commit/c48055927a1adac01b12db6566607e92c9e6a527))
* add private S3 frontend and CloudFront API routing ([0254214](https://github.com/jakobzagar/Fit-Track/commit/02542146b7e01458cdb9309b03e057a37f00e0d0))
* add private SSM endpoints ([2300687](https://github.com/jakobzagar/Fit-Track/commit/230068747abe32348bc41a99cd8464a11920fcb3))
* align AWS stack interfaces ([fa64429](https://github.com/jakobzagar/Fit-Track/commit/fa6442940c12a31c9f458a35ac8d521e8950edda))
* complete AWS network foundation ([9a854ac](https://github.com/jakobzagar/Fit-Track/commit/9a854acf417805c1b2b33b0374f773d7009723d3))
* complete ECS service and consolidate infrastructure templates ([1b907b0](https://github.com/jakobzagar/Fit-Track/commit/1b907b041670abb94c2fe36ee9cb59f162558d71))
* configure backend task and separate runtime secrets ([3bf7c6a](https://github.com/jakobzagar/Fit-Track/commit/3bf7c6a45b05cf3f53e122b0241317054cd3cfc3))
* configure Fargate cluster and exported service contracts ([67acf62](https://github.com/jakobzagar/Fit-Track/commit/67acf6234a1832cc736051643eb9e6d0e0df1c3c))
* configure frontend security headers and cache policies ([ee2b6ad](https://github.com/jakobzagar/Fit-Track/commit/ee2b6ad5620eba77176d968fe45c27f7d7d4ecd7))
* configure migration task and scoped ECS execution roles ([9a6dbb7](https://github.com/jakobzagar/Fit-Track/commit/9a6dbb769e6a39b7e0af9ddcaa5c0c30e07f7260))
* configure private PostgreSQL database and service exports ([e98c749](https://github.com/jakobzagar/Fit-Track/commit/e98c749d937e2b1171866c7208a9d9f391cd8bda))
* configure Single-AZ Fargate service and migration tasks ([4f5bc3a](https://github.com/jakobzagar/Fit-Track/commit/4f5bc3a7d9ead3f05bdbd4e805d0b09d5dbc0f74))
* connect ALB and backend task security groups ([54ff03f](https://github.com/jakobzagar/Fit-Track/commit/54ff03faaeb7bc0d55a32bbc94f3ef63ba98446e))
* enable RDS Multi-AZ standby replication ([0e276ef](https://github.com/jakobzagar/Fit-Track/commit/0e276ef4d3914a51007de7603922e2e1f09eedd8))
* refine ECS compute stack ([26ba2bb](https://github.com/jakobzagar/Fit-Track/commit/26ba2bb743247eda1ca160df0b3b69e5243b1a6b))
* rewrite frontend SPA navigation at CloudFront ([9a31146](https://github.com/jakobzagar/Fit-Track/commit/9a311461ec21ef90ba4cc4c82da1238384bec69c))


### Bug Fixes

* align Single-AZ database placement and VPC naming ([5ade0e8](https://github.com/jakobzagar/Fit-Track/commit/5ade0e8c26163c5b8414ddbd7d5e410b8dcc85a0))
* bootstrap ECS capacity before launching instances ([7a33973](https://github.com/jakobzagar/Fit-Track/commit/7a3397348e993a30894092f6c762bcaf49666c66))
* disable CloudFront minimum error caching ([c607ec2](https://github.com/jakobzagar/Fit-Track/commit/c607ec227d5e2712057347fdf6b66b6ebe6c81e8))
* include workspace runtime dependencies in backend image ([dff8778](https://github.com/jakobzagar/Fit-Track/commit/dff8778b8b8cf3462fdd6f8d0afc5110c39215c0))
* update brace-expansion dependency ([4abe95a](https://github.com/jakobzagar/Fit-Track/commit/4abe95ac35ca7137ac778802ebd071103b8056a9))

## 0.0.1 (2026-09-15)


### Bug Fixes

* clarify workout set metric requirements ([730254c](https://github.com/jakobzagar/Fit-Track/commit/730254ce85583dc95c9ceecc6123e03b5f8ffc16))
* expose exercise archiving explicitly ([0f118cf](https://github.com/jakobzagar/Fit-Track/commit/0f118cf9d8f36a5cf942f0bbe9017bcc2505efdd))
* make exercise names case-insensitively unique ([e0c7d7c](https://github.com/jakobzagar/Fit-Track/commit/e0c7d7cb0cc0eaf0f6ed66a0c89333e5e1331145))
* preserve exercise details in workout history ([dc9e636](https://github.com/jakobzagar/Fit-Track/commit/dc9e6368c69dea2983e1a9ddd34bbfe733f0db05))
* redact secrets from error logs ([1fd2424](https://github.com/jakobzagar/Fit-Track/commit/1fd2424eebc87a8ffe02b17c87975b7611bb49a2))
* select workout session layout through routing ([76977df](https://github.com/jakobzagar/Fit-Track/commit/76977df62ce9efe7337a3544f1a673da03cad2f7))

## Changelog
