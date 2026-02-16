import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { fsMkdirAdapter } from './fs-mkdir-adapter';
import { fsMkdirAdapterProxy } from './fs-mkdir-adapter.proxy';

describe('fsMkdirAdapter', () => {
  describe('successful creation', () => {
    it('VALID: {dirPath} => creates directory successfully', async () => {
      const proxy = fsMkdirAdapterProxy();
      const dirPath = FilePathStub({ value: '/path/to/new/dir' });

      proxy.succeeds();

      await expect(fsMkdirAdapter({ dirPath })).resolves.toBeUndefined();
    });
  });

  describe('error cases', () => {
    it('ERROR: {dirPath: "/readonly/dir"} => throws permission error', async () => {
      const proxy = fsMkdirAdapterProxy();
      const dirPath = FilePathStub({ value: '/readonly/dir' });

      proxy.throws({ error: new Error('EACCES: permission denied') });

      await expect(fsMkdirAdapter({ dirPath })).rejects.toThrow(/EACCES/u);
    });
  });
});
