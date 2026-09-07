/**
 * Pins WHICH FILES jest hands a test when it imports a sibling workspace package.
 *
 * This package's `jest.config.js` spreads the repo's `jest.config.base.js`, which twelve packages
 * share — so this file is the coverage for that base config's resolution behaviour, and a test in
 * `packages/testing` covers the one config that spreads nothing.
 *
 * Resolving to compiled output is what makes a green suite meaningless: a sub-agent edits
 * `packages/shared/src/...`, runs jest, and every assertion answers from the last build instead of
 * the edit. The suite passes against code it never saw, and the agent has no way to tell.
 */

import { resolve } from 'path';

const REPO_ROOT = resolve(__dirname, '../../..');

describe('jest module resolution', () => {
  describe('a workspace package imported by subpath', () => {
    it('VALID: {@dungeonmaster/shared/statics} => resolves to the source barrel', () => {
      const resolved = require.resolve('@dungeonmaster/shared/statics');

      expect(resolved).toBe(`${REPO_ROOT}/packages/shared/statics.ts`);
    });

    it('VALID: {@dungeonmaster/shared/contracts} => resolves to the source barrel', () => {
      const resolved = require.resolve('@dungeonmaster/shared/contracts');

      expect(resolved).toBe(`${REPO_ROOT}/packages/shared/contracts.ts`);
    });

    it('VALID: {@dungeonmaster/shared/transformers} => resolves to the source barrel', () => {
      const resolved = require.resolve('@dungeonmaster/shared/transformers');

      expect(resolved).toBe(`${REPO_ROOT}/packages/shared/transformers.ts`);
    });
  });

  describe('a workspace package imported by its main barrel', () => {
    it('VALID: {@dungeonmaster/testing} => resolves to a source file', () => {
      const resolved = require.resolve('@dungeonmaster/testing');

      expect(resolved).toBe(`${REPO_ROOT}/packages/testing/src/index.ts`);
    });
  });
});
