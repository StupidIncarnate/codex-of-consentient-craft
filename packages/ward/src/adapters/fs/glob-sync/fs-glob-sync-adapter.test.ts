import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { fsGlobSyncAdapter } from './fs-glob-sync-adapter';
import { fsGlobSyncAdapterProxy } from './fs-glob-sync-adapter.proxy';

describe('fsGlobSyncAdapter', () => {
  describe('matching files', () => {
    it('VALID: {patterns with matches} => returns count of matched files', () => {
      const proxy = fsGlobSyncAdapterProxy();
      proxy.returnsCount({ count: 3 });

      const result = fsGlobSyncAdapter({
        patterns: ['src/**/*.ts'],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toBe(3);
    });
  });

  describe('no matches', () => {
    it('VALID: {patterns with no matches} => returns 0', () => {
      const proxy = fsGlobSyncAdapterProxy();
      proxy.returnsCount({ count: 0 });

      const result = fsGlobSyncAdapter({
        patterns: ['src/**/*.ts'],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toBe(0);
    });
  });

  describe('exclude patterns', () => {
    it('VALID: {patterns with exclude} => returns filtered count', () => {
      const proxy = fsGlobSyncAdapterProxy();
      proxy.returnsCount({ count: 5 });

      const result = fsGlobSyncAdapter({
        patterns: ['src/**/*.ts'],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
        exclude: ['**/*.integration.test.ts'],
      });

      expect(result).toBe(5);
    });
  });
});
