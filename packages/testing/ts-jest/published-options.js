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
 */
'use strict';

const dungeonmasterTransformers = require('./transformers.js');

module.exports = {
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
