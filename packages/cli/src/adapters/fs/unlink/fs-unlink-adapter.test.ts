import { fsUnlinkAdapter } from './fs-unlink-adapter';
import { fsUnlinkAdapterProxy } from './fs-unlink-adapter.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

describe('fsUnlinkAdapter', () => {
  describe('successful delete operations', () => {
    it('VALID: {filePath: "/quests/.cli-signal"} => deletes file successfully', async () => {
      const proxy = fsUnlinkAdapterProxy();
      const filePath = FilePathStub({ value: '/quests/.cli-signal' });

      proxy.succeeds();

      await expect(fsUnlinkAdapter({ filePath })).resolves.toBeUndefined();
    });

    it('VALID: {filePath: "/other/file.txt"} => deletes different file successfully', async () => {
      const proxy = fsUnlinkAdapterProxy();
      const filePath = FilePathStub({ value: '/other/file.txt' });

      proxy.succeeds();

      await expect(fsUnlinkAdapter({ filePath })).resolves.toBeUndefined();
    });
  });

  describe('error conditions', () => {
    it('ERROR: {filePath: "/nonexistent/file.txt"} => throws when file does not exist', async () => {
      const proxy = fsUnlinkAdapterProxy();
      const filePath = FilePathStub({ value: '/nonexistent/file.txt' });

      proxy.rejects({ error: new Error('ENOENT: no such file or directory') });

      await expect(fsUnlinkAdapter({ filePath })).rejects.toThrow(/ENOENT/u);
    });

    it('ERROR: {filePath: "/protected/file.txt"} => throws when permission denied', async () => {
      const proxy = fsUnlinkAdapterProxy();
      const filePath = FilePathStub({ value: '/protected/file.txt' });

      proxy.rejects({ error: new Error('EACCES: permission denied') });

      await expect(fsUnlinkAdapter({ filePath })).rejects.toThrow(/EACCES/u);
    });
  });
});
