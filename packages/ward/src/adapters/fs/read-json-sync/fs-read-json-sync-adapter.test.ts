import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { fsReadJsonSyncAdapter } from './fs-read-json-sync-adapter';
import { fsReadJsonSyncAdapterProxy } from './fs-read-json-sync-adapter.proxy';

describe('fsReadJsonSyncAdapter', () => {
  describe('valid JSON', () => {
    it('VALID: {filePath with valid JSON content} => returns parsed object', () => {
      const proxy = fsReadJsonSyncAdapterProxy();
      proxy.returns({ content: '{"include":["src/**/*"],"exclude":["dist"]}' });

      const result = fsReadJsonSyncAdapter({
        filePath: FilePathStub({ value: '/project/tsconfig.json' }),
      });

      expect(result).toStrictEqual({ include: ['src/**/*'], exclude: ['dist'] });
    });

    it('VALID: {filePath with JSON array} => returns parsed array', () => {
      const proxy = fsReadJsonSyncAdapterProxy();
      proxy.returns({ content: '["a","b","c"]' });

      const result = fsReadJsonSyncAdapter({
        filePath: FilePathStub({ value: '/project/data.json' }),
      });

      expect(result).toStrictEqual(['a', 'b', 'c']);
    });
  });

  describe('error cases', () => {
    it('ERROR: {filePath does not exist} => throws file not found error', () => {
      const proxy = fsReadJsonSyncAdapterProxy();
      proxy.throws({ error: new Error('ENOENT: no such file or directory') });

      expect(() =>
        fsReadJsonSyncAdapter({
          filePath: FilePathStub({ value: '/project/missing.json' }),
        }),
      ).toThrow(/ENOENT/u);
    });

    it('ERROR: {filePath with invalid JSON} => throws JSON parse error', () => {
      const proxy = fsReadJsonSyncAdapterProxy();
      proxy.returns({ content: '{ invalid json }' });

      expect(() =>
        fsReadJsonSyncAdapter({
          filePath: FilePathStub({ value: '/project/bad.json' }),
        }),
      ).toThrow(/JSON/u);
    });
  });
});
