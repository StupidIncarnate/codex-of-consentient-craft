import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { fsGlobSyncAdapter } from './fs-glob-sync-adapter';
import { fsGlobSyncAdapterProxy } from './fs-glob-sync-adapter.proxy';

describe('fsGlobSyncAdapter', () => {
  describe('matching files', () => {
    it('VALID: {patterns with matches} => returns count and file list', () => {
      const proxy = fsGlobSyncAdapterProxy();
      proxy.returnsFiles({ files: ['src/a.ts', 'src/b.ts', 'src/c.ts'] });

      const result = fsGlobSyncAdapter({
        patterns: ['src/**/*.ts'],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        discoveredCount: 3,
        discoveredFiles: ['src/a.ts', 'src/b.ts', 'src/c.ts'],
      });
    });
  });

  describe('no matches', () => {
    it('VALID: {patterns with no matches} => returns 0 and empty file list', () => {
      const proxy = fsGlobSyncAdapterProxy();
      proxy.returnsCount({ count: 0 });

      const result = fsGlobSyncAdapter({
        patterns: ['src/**/*.ts'],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        discoveredCount: 0,
        discoveredFiles: [],
      });
    });
  });

  describe('exclude patterns', () => {
    it('VALID: {patterns with exclude} => returns filtered count and files', () => {
      const proxy = fsGlobSyncAdapterProxy();
      proxy.returnsFiles({ files: ['src/a.ts', 'src/b.ts', 'src/c.ts', 'src/d.ts', 'src/e.ts'] });

      const result = fsGlobSyncAdapter({
        patterns: ['src/**/*.ts'],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
        exclude: ['**/*.integration.test.ts'],
      });

      expect(result).toStrictEqual({
        discoveredCount: 5,
        discoveredFiles: ['src/a.ts', 'src/b.ts', 'src/c.ts', 'src/d.ts', 'src/e.ts'],
      });
    });
  });
});
