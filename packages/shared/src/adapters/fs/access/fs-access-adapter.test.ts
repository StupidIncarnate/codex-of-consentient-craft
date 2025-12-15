import { fsAccessAdapter } from './fs-access-adapter';
import { fsAccessAdapterProxy } from './fs-access-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('fsAccessAdapter', () => {
  describe('file access success', () => {
    it('VALID: {filePath: "/config.json", mode: 4} => resolves when file is accessible', async () => {
      const proxy = fsAccessAdapterProxy();
      const filePath = FilePathStub({ value: '/config.json' });

      proxy.resolves();

      await expect(fsAccessAdapter({ filePath, mode: 4 })).resolves.toBeUndefined();
    });
  });

  describe('file access failure', () => {
    it('ERROR: {filePath: "/missing.json", mode: 4} => rejects when file is not accessible', async () => {
      const proxy = fsAccessAdapterProxy();
      const filePath = FilePathStub({ value: '/missing.json' });
      const error = new Error('ENOENT: no such file or directory');

      proxy.rejects({ error });

      await expect(fsAccessAdapter({ filePath, mode: 4 })).rejects.toThrow(error);
    });
  });
});
