import { fsAccessAdapter } from './fs-access-adapter';
import { fsAccessAdapterProxy } from './fs-access-adapter.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

describe('fsAccessAdapter', () => {
  describe('successful access checks', () => {
    it('VALID: {filePath: "/config.json", mode: 4} => resolves when file is accessible', async () => {
      const proxy = fsAccessAdapterProxy();
      const filePath = FilePathStub({ value: '/config.json' });
      const mode = 4;

      proxy.resolves();

      await expect(fsAccessAdapter({ filePath, mode })).resolves.toBeUndefined();
    });

    it('VALID: {filePath: "/project/.dungeonmaster", mode: 4} => resolves for readable config file', async () => {
      const proxy = fsAccessAdapterProxy();
      const filePath = FilePathStub({ value: '/project/.dungeonmaster' });
      const mode = 4;

      proxy.resolves();

      await expect(fsAccessAdapter({ filePath, mode })).resolves.toBeUndefined();
    });
  });

  describe('access denied cases', () => {
    it('ERROR: {filePath: "/nonexistent.json", mode: 4} => rejects when file does not exist', async () => {
      const proxy = fsAccessAdapterProxy();
      const filePath = FilePathStub({ value: '/nonexistent.json' });
      const mode = 4;

      proxy.rejects({ error: new Error('ENOENT: no such file or directory') });

      await expect(fsAccessAdapter({ filePath, mode })).rejects.toThrow(/ENOENT/u);
    });

    it('ERROR: {filePath: "/restricted.json", mode: 4} => rejects when file is not readable', async () => {
      const proxy = fsAccessAdapterProxy();
      const filePath = FilePathStub({ value: '/restricted.json' });
      const mode = 4;

      proxy.rejects({ error: new Error('EACCES: permission denied') });

      await expect(fsAccessAdapter({ filePath, mode })).rejects.toThrow(/EACCES/u);
    });
  });
});
