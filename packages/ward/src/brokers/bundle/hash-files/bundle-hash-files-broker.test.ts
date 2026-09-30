import { bundleHashFilesBroker } from './bundle-hash-files-broker';
import { bundleHashFilesBrokerProxy } from './bundle-hash-files-broker.proxy';

// sha-256 of nothing at all.
const EMPTY_DIGEST = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const ONE_FILE_DIGEST = 'c36eea577cd1198ce56f42b906e16f7d07aa227ce4d5c506d463cdfba0b11114';
const TWO_FILE_DIGEST = '51cce8b7e058e0ef43e7a2d4d51a11e8414167a485010e1eb4421f3c1adb16a9';
const EDITED_DIGEST = 'd4f3a6cc0afb0453b7aedfdf5750126c86d71c78a72e8f4a55906ab6a6338dd6';
const RENAMED_DIGEST = 'c06ab6e928e694a9ba07e76fa538db3e14c6c843be905c941af9c13c0f223593';

describe('bundleHashFilesBroker', () => {
  describe('empty input', () => {
    it('EMPTY: {relativePaths: []} => returns the sha-256 of no bytes', () => {
      const rootPath = '/repo';
      bundleHashFilesBrokerProxy();

      const result = bundleHashFilesBroker({ rootPath, relativePaths: [] });

      expect(result).toBe(EMPTY_DIGEST);
    });
  });

  describe('hashing contents', () => {
    it('VALID: {one file} => returns the digest over its path, length and bytes', () => {
      const rootPath = '/repo';
      const app = 'packages/web/src/app.tsx';
      const proxy = bundleHashFilesBrokerProxy();
      proxy.hasFile({ rootPath, relativePath: app, contents: 'export const App = 1;' });

      const result = bundleHashFilesBroker({ rootPath, relativePaths: [app] });

      expect(result).toBe(ONE_FILE_DIGEST);
    });

    it('VALID: {same file, edited contents} => returns a different digest', () => {
      const rootPath = '/repo';
      const app = 'packages/web/src/app.tsx';
      const proxy = bundleHashFilesBrokerProxy();
      proxy.hasFile({ rootPath, relativePath: app, contents: 'export const App = 2;' });

      const result = bundleHashFilesBroker({ rootPath, relativePaths: [app] });

      expect(result).toBe(EDITED_DIGEST);
    });

    it('VALID: {same contents at a different path} => returns a different digest', () => {
      const rootPath = '/repo';
      const renamed = 'packages/web/src/app2.tsx';
      const proxy = bundleHashFilesBrokerProxy();
      proxy.hasFile({ rootPath, relativePath: renamed, contents: 'export const App = 1;' });

      const result = bundleHashFilesBroker({ rootPath, relativePaths: [renamed] });

      expect(result).toBe(RENAMED_DIGEST);
    });
  });

  describe('byte exactness', () => {
    it('VALID: {a file whose bytes are not valid utf-8} => digests the raw bytes and their byte length', () => {
      const rootPath = '/repo';
      const binary = 'a.bin';
      const proxy = bundleHashFilesBrokerProxy();
      proxy.hasBytes({ rootPath, relativePath: binary, bytes: [0xff, 0xe2, 0x82, 0xac] });

      const result = bundleHashFilesBroker({ rootPath, relativePaths: [binary] });

      expect(result).toBe('213700dd41735a9a6798bf5cc6be14a6a4d483a47de1160288972d61397a698e');
    });
  });

  describe('path ordering', () => {
    it('VALID: {two files listed in path order} => returns the two-file digest', () => {
      const rootPath = '/repo';
      const statics = 'packages/shared/statics.ts';
      const app = 'packages/web/src/app.tsx';
      const proxy = bundleHashFilesBrokerProxy();
      proxy.hasFile({ rootPath, relativePath: statics, contents: 'export const s = 2;' });
      proxy.hasFile({ rootPath, relativePath: app, contents: 'export const App = 1;' });

      const result = bundleHashFilesBroker({ rootPath, relativePaths: [statics, app] });

      expect(result).toBe(TWO_FILE_DIGEST);
    });

    it('VALID: {the same two files listed in reverse} => returns the same digest', () => {
      const rootPath = '/repo';
      const statics = 'packages/shared/statics.ts';
      const app = 'packages/web/src/app.tsx';
      const proxy = bundleHashFilesBrokerProxy();
      proxy.hasFile({ rootPath, relativePath: statics, contents: 'export const s = 2;' });
      proxy.hasFile({ rootPath, relativePath: app, contents: 'export const App = 1;' });

      const result = bundleHashFilesBroker({ rootPath, relativePaths: [app, statics] });

      expect(result).toBe(TWO_FILE_DIGEST);
    });
  });

  describe('entries that carry no content', () => {
    it('EDGE: {a directory among the paths} => hashes as if it were not listed', () => {
      const rootPath = '/repo';
      const app = 'packages/web/src/app.tsx';
      const directory = 'packages/web/src';
      const proxy = bundleHashFilesBrokerProxy();
      proxy.hasFile({ rootPath, relativePath: app, contents: 'export const App = 1;' });
      proxy.isDirectory({ rootPath, relativePath: directory });

      const result = bundleHashFilesBroker({ rootPath, relativePaths: [app, directory] });

      expect(result).toBe(ONE_FILE_DIGEST);
    });

    it('EDGE: {a path deleted between glob and read} => hashes as if it were not listed', () => {
      const rootPath = '/repo';
      const app = 'packages/web/src/app.tsx';
      const gone = 'packages/web/src/gone.tsx';
      const proxy = bundleHashFilesBrokerProxy();
      proxy.hasFile({ rootPath, relativePath: app, contents: 'export const App = 1;' });
      proxy.isMissing({ rootPath, relativePath: gone });

      const result = bundleHashFilesBroker({ rootPath, relativePaths: [app, gone] });

      expect(result).toBe(ONE_FILE_DIGEST);
    });
  });

  describe('unreadable input', () => {
    it('ERROR: {a file the process may not read} => rethrows rather than hashing a short set', () => {
      const rootPath = '/repo';
      const locked = 'packages/web/src/locked.tsx';
      const proxy = bundleHashFilesBrokerProxy();
      proxy.failsWith({ rootPath, relativePath: locked, code: 'EACCES' });

      expect(() => bundleHashFilesBroker({ rootPath, relativePaths: [locked] })).toThrow(
        /^EACCES: op '\/repo\/packages\/web\/src\/locked\.tsx'$/u,
      );
    });
  });
});
