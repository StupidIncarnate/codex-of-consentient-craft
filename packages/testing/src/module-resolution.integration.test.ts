/**
 * Pins WHICH FILES jest hands a test in THIS package when it imports a sibling workspace package.
 *
 * `packages/testing/jest.config.js` spreads nothing. The repo's `jest.config.base.js` copy of
 * `testEnvironmentOptions.customExportConditions` never reaches it, so the base config's own pin
 * (`packages/config/src/module-resolution.integration.test.ts`) says nothing whatsoever about this
 * config, and a hand-edit that drops `source` from this one is silent.
 *
 * `import-path-resolver-middleware.test.ts` cannot stand in for this file, and believing it did is
 * what left the gap: that middleware normalises `/dist/` out of a path and `.js` to `.ts`, so
 * `packages/shared/dist/testing.js` and `packages/shared/testing.ts` collapse to the SAME string
 * before any assertion sees them. It passes under either resolution.
 *
 * Resolving to compiled output is what makes a green suite meaningless: a sub-agent edits
 * `packages/shared/src/...`, runs jest, and every assertion answers from the last build instead of
 * the edit. The suite passes against code it never saw, and the agent has no way to tell.
 */

import { resolve } from 'path';

const REPO_ROOT = resolve(__dirname, '../../..');

describe('jest module resolution', () => {
  describe('a workspace package imported by subpath', () => {
    it('VALID: {@dungeonmaster/shared/statics} => resolves to the source barrel, never dist', () => {
      const resolved = require.resolve('@dungeonmaster/shared/statics');

      expect({ resolved, insideDist: resolved.split('/').includes('dist') }).toStrictEqual({
        resolved: `${REPO_ROOT}/packages/shared/statics.ts`,
        insideDist: false,
      });
    });

    it('VALID: {@dungeonmaster/shared/contracts} => resolves to the source barrel, never dist', () => {
      const resolved = require.resolve('@dungeonmaster/shared/contracts');

      expect({ resolved, insideDist: resolved.split('/').includes('dist') }).toStrictEqual({
        resolved: `${REPO_ROOT}/packages/shared/contracts.ts`,
        insideDist: false,
      });
    });

    it('VALID: {@dungeonmaster/shared/testing} => resolves to the source barrel, never dist', () => {
      const resolved = require.resolve('@dungeonmaster/shared/testing');

      expect({ resolved, insideDist: resolved.split('/').includes('dist') }).toStrictEqual({
        resolved: `${REPO_ROOT}/packages/shared/testing.ts`,
        insideDist: false,
      });
    });
  });
});
