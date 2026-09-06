import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { fsStatAdapter } from './fs-stat-adapter';
import { fsStatAdapterProxy } from './fs-stat-adapter.proxy';

describe('fsStatAdapter', () => {
  describe('reading metadata', () => {
    it('VALID: {filePath: existing} => returns stats carrying mtimeMs', async () => {
      const proxy = fsStatAdapterProxy();
      const filePath = FilePathStub({ value: '/pkg/node_modules/.vite-40000' });

      proxy.returnsMtime({ filePath, mtimeMs: 1234 });

      const result = await fsStatAdapter({ filePath });

      expect(result?.mtimeMs).toBe(1234);
    });
  });

  describe('absent path', () => {
    it('EMPTY: {filePath: missing} => returns null instead of throwing', async () => {
      const proxy = fsStatAdapterProxy();
      const filePath = FilePathStub({ value: '/pkg/node_modules/.vite-99999' });

      proxy.returnsNull({ filePath });

      const result = await fsStatAdapter({ filePath });

      expect(result).toBe(null);
    });
  });

  describe('error cases', () => {
    it('ERROR: {filePath: permission denied} => rethrows a non-ENOENT error', async () => {
      const proxy = fsStatAdapterProxy();
      const filePath = FilePathStub({ value: '/pkg/node_modules/.vite-40000' });

      proxy.throws({
        filePath,
        error: Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' }),
      });

      await expect(fsStatAdapter({ filePath })).rejects.toThrow(/EACCES/u);
    });
  });
});
