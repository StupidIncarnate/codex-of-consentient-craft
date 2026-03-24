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

module.exports = [
  { path: require.resolve('./proxy-mock-transformer.js') },
  { path: require.resolve('./harness-lifecycle-transformer.js') },
];
