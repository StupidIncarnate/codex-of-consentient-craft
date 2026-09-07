import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { cryptoHashFilesAdapter } from './crypto-hash-files-adapter';
import { cryptoHashFilesAdapterProxy } from './crypto-hash-files-adapter.proxy';
import { GitRelativePathStub } from '../../../contracts/git-relative-path/git-relative-path.stub';

// sha-256 of nothing at all.
const EMPTY_DIGEST = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const ONE_FILE_DIGEST = 'c36eea577cd1198ce56f42b906e16f7d07aa227ce4d5c506d463cdfba0b11114';
const TWO_FILE_DIGEST = '51cce8b7e058e0ef43e7a2d4d51a11e8414167a485010e1eb4421f3c1adb16a9';
const EDITED_DIGEST = 'd4f3a6cc0afb0453b7aedfdf5750126c86d71c78a72e8f4a55906ab6a6338dd6';
const RENAMED_DIGEST = 'c06ab6e928e694a9ba07e76fa538db3e14c6c843be905c941af9c13c0f223593';

describe('cryptoHashFilesAdapter', () => {
  describe('empty input', () => {
    it('EMPTY: {relativePaths: []} => returns the sha-256 of no bytes', () => {
      const rootPath = AbsoluteFilePathStub({ value: '/repo' });
      cryptoHashFilesAdapterProxy();

      const result = cryptoHashFilesAdapter({ rootPath, relativePaths: [] });

      expect(result).toBe(EMPTY_DIGEST);
    });
  });

  describe('hashing contents', () => {
    it('VALID: {one file} => returns the digest over its path, length and bytes', () => {
      const rootPath = AbsoluteFilePathStub({ value: '/repo' });
      const app = GitRelativePathStub({ value: 'packages/web/src/app.tsx' });
      const proxy = cryptoHashFilesAdapterProxy();
      proxy.hasFile({ rootPath, relativePath: app, contents: 'export const App = 1;' });

      const result = cryptoHashFilesAdapter({ rootPath, relativePaths: [app] });

      expect(result).toBe(ONE_FILE_DIGEST);
    });

    it('VALID: {same file, edited contents} => returns a different digest', () => {
      const rootPath = AbsoluteFilePathStub({ value: '/repo' });
      const app = GitRelativePathStub({ value: 'packages/web/src/app.tsx' });
      const proxy = cryptoHashFilesAdapterProxy();
      proxy.hasFile({ rootPath, relativePath: app, contents: 'export const App = 2;' });

      const result = cryptoHashFilesAdapter({ rootPath, relativePaths: [app] });

      expect(result).toBe(EDITED_DIGEST);
    });

    it('VALID: {same contents at a different path} => returns a different digest', () => {
      const rootPath = AbsoluteFilePathStub({ value: '/repo' });
      const renamed = GitRelativePathStub({ value: 'packages/web/src/app2.tsx' });
      const proxy = cryptoHashFilesAdapterProxy();
      proxy.hasFile({ rootPath, relativePath: renamed, contents: 'export const App = 1;' });

      const result = cryptoHashFilesAdapter({ rootPath, relativePaths: [renamed] });

      expect(result).toBe(RENAMED_DIGEST);
    });
  });

  describe('path ordering', () => {
    it('VALID: {two files listed in path order} => returns the two-file digest', () => {
      const rootPath = AbsoluteFilePathStub({ value: '/repo' });
      const statics = GitRelativePathStub({ value: 'packages/shared/statics.ts' });
      const app = GitRelativePathStub({ value: 'packages/web/src/app.tsx' });
      const proxy = cryptoHashFilesAdapterProxy();
      proxy.hasFile({ rootPath, relativePath: statics, contents: 'export const s = 2;' });
      proxy.hasFile({ rootPath, relativePath: app, contents: 'export const App = 1;' });

      const result = cryptoHashFilesAdapter({ rootPath, relativePaths: [statics, app] });

      expect(result).toBe(TWO_FILE_DIGEST);
    });

    it('VALID: {the same two files listed in reverse} => returns the same digest', () => {
      const rootPath = AbsoluteFilePathStub({ value: '/repo' });
      const statics = GitRelativePathStub({ value: 'packages/shared/statics.ts' });
      const app = GitRelativePathStub({ value: 'packages/web/src/app.tsx' });
      const proxy = cryptoHashFilesAdapterProxy();
      proxy.hasFile({ rootPath, relativePath: statics, contents: 'export const s = 2;' });
      proxy.hasFile({ rootPath, relativePath: app, contents: 'export const App = 1;' });

      const result = cryptoHashFilesAdapter({ rootPath, relativePaths: [app, statics] });

      expect(result).toBe(TWO_FILE_DIGEST);
    });
  });

  describe('entries that carry no content', () => {
    it('EDGE: {a directory among the paths} => hashes as if it were not listed', () => {
      const rootPath = AbsoluteFilePathStub({ value: '/repo' });
      const app = GitRelativePathStub({ value: 'packages/web/src/app.tsx' });
      const directory = GitRelativePathStub({ value: 'packages/web/src' });
      const proxy = cryptoHashFilesAdapterProxy();
      proxy.hasFile({ rootPath, relativePath: app, contents: 'export const App = 1;' });
      proxy.isDirectory({ rootPath, relativePath: directory });

      const result = cryptoHashFilesAdapter({ rootPath, relativePaths: [app, directory] });

      expect(result).toBe(ONE_FILE_DIGEST);
    });

    it('EDGE: {a path deleted between glob and read} => hashes as if it were not listed', () => {
      const rootPath = AbsoluteFilePathStub({ value: '/repo' });
      const app = GitRelativePathStub({ value: 'packages/web/src/app.tsx' });
      const gone = GitRelativePathStub({ value: 'packages/web/src/gone.tsx' });
      const proxy = cryptoHashFilesAdapterProxy();
      proxy.hasFile({ rootPath, relativePath: app, contents: 'export const App = 1;' });
      proxy.isMissing({ rootPath, relativePath: gone });

      const result = cryptoHashFilesAdapter({ rootPath, relativePaths: [app, gone] });

      expect(result).toBe(ONE_FILE_DIGEST);
    });
  });

  describe('unreadable input', () => {
    it('ERROR: {a file the process may not read} => rethrows rather than hashing a short set', () => {
      const rootPath = AbsoluteFilePathStub({ value: '/repo' });
      const locked = GitRelativePathStub({ value: 'packages/web/src/locked.tsx' });
      const proxy = cryptoHashFilesAdapterProxy();
      proxy.failsWith({ rootPath, relativePath: locked, code: 'EACCES' });

      expect(() => cryptoHashFilesAdapter({ rootPath, relativePaths: [locked] })).toThrow(
        /^EACCES: read failed$/u,
      );
    });
  });
});
