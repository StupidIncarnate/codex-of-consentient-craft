/**
 * Shared ts-jest inline options for the PUBLISHED `@dungeonmaster/testing/jest-config-base.js` —
 * what a real consumer's own `jest.config.js` gets by spreading that base.
 *
 * commonjs/node pinned: a consumer's root tsconfig resolves `node16` (that is how `#gateway/...`
 * imports resolve for `tsc`), and ts-jest refuses `node16` outside its own `isolatedModules` mode.
 * Jest resolves modules itself, so tests lose nothing.
 *
 * No `isolatedModules` here, unlike this repo's own internal `./options.js` sibling: that pin exists
 * only to keep the proxy-mock transformer's TypeScript `program` alive, and this object already
 * omits `isolatedModules` entirely — carried forward unchanged from what
 * `packages/testing/jest-config-base.js` inlined before this extraction.
 *
 * `diagnostics: false`: without `isolatedModules`, ts-jest builds a full program and type-checks
 * every file it transforms — including `@dungeonmaster/testing`'s OWN `.ts` files once
 * `jest-config-base.js`'s `transformIgnorePatterns` lets them be transformed from inside a real
 * consumer's `node_modules`. From THERE, this `moduleResolution: 'node'` (classic) cannot see
 * `@dungeonmaster/shared`'s subpath `exports` map, so every one of those files' own
 * `@dungeonmaster/shared/*` imports fails semantic checking with a real TS2307 — confirmed against
 * a real packed-and-installed consumer (item G25). `diagnostics: false` only skips
 * `getSemanticDiagnostics`; the program and `getEmitOutput` this file's own header already commits
 * to keeping (for the AST transformers below) stay exactly as they were. Jest resolves modules
 * itself at test RUN time regardless, so nothing here changes what actually executes.
 */
'use strict';

const dungeonmasterTransformers = require('./transformers.js');

module.exports = {
  diagnostics: false,
  tsconfig: {
    allowJs: true,
    esModuleInterop: true,
    skipLibCheck: true,
    module: 'commonjs',
    moduleResolution: 'node',
  },
  astTransformers: {
    before: dungeonmasterTransformers,
  },
};
