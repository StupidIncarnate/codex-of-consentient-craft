/**
 * Pins WHICH FILES jest hands a test in THIS package when it imports a sibling workspace package.
 *
 * `packages/web/jest.config.cjs` merges `jest.config.base.js` and then REPLACES
 * `testEnvironmentOptions` wholesale — its own list is `['source', '', 'require', 'default']`, where
 * the empty string is MSW's jsdom workaround. So the base config's pin
 * (`packages/config/src/module-resolution.integration.test.ts`) covers none of this, and this is a
 * jsdom environment besides: nothing about node's resolution carries over on its own.
 *
 * The `@dungeonmaster/testing` case is the one with teeth here. Both of this package's
 * `setupFilesAfterEnv` entries reach into `packages/testing/src/` by relative path, but the specs
 * reach `endpointMock` through the PACKAGE name. Resolve that name to `dist` and MSW's server is
 * built from a second module instance, so every handler a spec registers lands on a server that is
 * not the one listening — which surfaces as "[MSW] Cannot bypass a request", nowhere near a
 * resolution error.
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
  });

  describe('a workspace package imported by its main barrel', () => {
    it('VALID: {@dungeonmaster/testing} => resolves to the source entry, never dist', () => {
      const resolved = require.resolve('@dungeonmaster/testing');

      expect({ resolved, insideDist: resolved.split('/').includes('dist') }).toStrictEqual({
        resolved: `${REPO_ROOT}/packages/testing/src/index.ts`,
        insideDist: false,
      });
    });
  });
});
