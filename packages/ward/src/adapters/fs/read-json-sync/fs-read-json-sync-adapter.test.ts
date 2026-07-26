import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { fsReadJsonSyncAdapter } from './fs-read-json-sync-adapter';
import { fsReadJsonSyncAdapterProxy } from './fs-read-json-sync-adapter.proxy';

describe('fsReadJsonSyncAdapter', () => {
  describe('valid JSON', () => {
    it('VALID: {filePath with valid JSON content} => returns parsed object', () => {
      const proxy = fsReadJsonSyncAdapterProxy();
      const filePath = FilePathStub({ value: '/project/tsconfig.json' });
      proxy.returns({ filePath, content: '{"include":["src/**/*"],"exclude":["dist"]}' });

      const result = fsReadJsonSyncAdapter({ filePath });

      expect(result).toStrictEqual({ include: ['src/**/*'], exclude: ['dist'] });
    });

    it('VALID: {filePath with JSON array} => returns parsed array', () => {
      const proxy = fsReadJsonSyncAdapterProxy();
      const filePath = FilePathStub({ value: '/project/data.json' });
      proxy.returns({ filePath, content: '["a","b","c"]' });

      const result = fsReadJsonSyncAdapter({ filePath });

      expect(result).toStrictEqual(['a', 'b', 'c']);
    });
  });

  describe('error cases', () => {
    it('ERROR: {filePath does not exist} => throws file not found error', () => {
      const proxy = fsReadJsonSyncAdapterProxy();
      const filePath = FilePathStub({ value: '/project/missing.json' });
      proxy.throws({ filePath, error: new Error('ENOENT: no such file or directory') });

      expect(() => fsReadJsonSyncAdapter({ filePath })).toThrow(/ENOENT/u);
    });

    it('ERROR: {filePath with invalid JSON} => throws JSON parse error', () => {
      const proxy = fsReadJsonSyncAdapterProxy();
      const filePath = FilePathStub({ value: '/project/bad.json' });
      proxy.returns({ filePath, content: '{ invalid json }' });

      expect(() => fsReadJsonSyncAdapter({ filePath })).toThrow(/JSON/u);
    });
  });
});
