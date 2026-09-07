/**
 * Consolidated AST transformers for ts-jest.
 *
 * All jest configs import from this single file so adding a new transformer
 * only requires editing one place. External repos consuming @dungeonmaster/testing
 * reference this file in their jest config:
 *
 *   const dungeonmasterTransformers = require('@dungeonmaster/testing/ts-jest/transformers.js');
 *   astTransformers: { before: dungeonmasterTransformers }
 */
'use strict';

// Jest loads this file, and each transformer it names, with plain Node `require` — before ts-jest
// exists — so no jest export condition can reach them and an extensionless require of a `.ts` file
// fails outright. Registering tsx's CJS hook here is what lets the requires below reach source.
// It is repeated in EVERY transformer file, not just this barrel: ts-jest requires each
// `astTransformers.before` entry by path on its own, and a jest config may hand-list one.
require('tsx/cjs');

module.exports = [
  { path: require.resolve('./proxy-mock-transformer.js') },
  { path: require.resolve('./harness-lifecycle-transformer.js') },
];
