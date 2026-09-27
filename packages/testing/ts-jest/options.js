/**
 * Shared ts-jest inline options for every INTERNAL jest config in this monorepo — the repo-root
 * `jest.config.base.js`, every per-package `jest.config.*` that used to restate this object inside
 * its own `transform` override, and `create-package`'s own scaffold templates
 * (`packageScaffoldConfigStatics`).
 *
 * Derives from `./published-options.js` and adds only `isolatedModules: true` to its `tsconfig` —
 * every other key, `astTransformers` included, stays exactly what the published object carries, so a
 * future ts-jest option added there reaches both without a second edit.
 *
 * `isolatedModules: true` and `module: 'commonjs'` / `moduleResolution: 'node'` are pinned
 * deliberately and are NOT the published tsconfig's `node16` change
 * (`packages/eslint-plugin/configs/tsconfig.json`): ts-jest refuses `node16` outside its own
 * `isolatedModules` mode, and turning `isolatedModules` OFF is what would actually help
 * `diagnostics: false` pay for itself — measured on `packages/config` at 3.4% of cold-cache CPU and
 * nothing at all warm, since a warm transform cache skips ts-jest entirely; `diagnostics: false`
 * only skips `getSemanticDiagnostics`, and building the TypeScript program plus `getEmitOutput`
 * stay either way. `isolatedModules` DOES remove that program, and removing it is unusable as
 * things stand: ts-jest only sets `program` when `isolatedModules` is off, and the proxy-mock
 * transformer in `./published-options.js`'s `astTransformers` reads proxy source files out of that
 * program to hoist `jest.mock()` calls. Turning `isolatedModules` on stops the hoisting silently.
 * Jest resolves modules itself at test run time regardless of what `moduleResolution` ts-jest's own
 * type-checking uses, so nothing is lost by leaving this pinned here rather than following the
 * published tsconfig to `node16`.
 */
'use strict';

const dungeonmasterPublishedTsJestOptions = require('./published-options.js');

module.exports = {
  ...dungeonmasterPublishedTsJestOptions,
  tsconfig: {
    ...dungeonmasterPublishedTsJestOptions.tsconfig,
    isolatedModules: true,
  },
};
