import { diskFreeBytes } from './disk-free-bytes';
import { diskFreeBytesProxy } from './disk-free-bytes.proxy';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

describe('diskFreeBytes', () => {
  describe('successful reads', () => {
    it('VALID: {path: a real filesystem} => returns available blocks times block size', async () => {
      const proxy = diskFreeBytesProxy();
      proxy.returns({ path: '/home/user/.dungeonmaster', bavail: 1000, bsize: 4096 });

      const result = await diskFreeBytes('/home/user/.dungeonmaster');

      expect(result).toBe(4096000);
    });
  });

  describe('sad paths', () => {
    it('ERROR: {path: missing} => rejects with the raw ENOENT error', async () => {
      const proxy = diskFreeBytesProxy();
      const error = FsErrorStub({ code: 'ENOENT' });
      proxy.rejects({ path: '/repo/missing', error });

      await expect(diskFreeBytes('/repo/missing')).rejects.toBe(error);
    });

    it('ERROR: {path: permission denied} => rejects with the raw EACCES error', async () => {
      const proxy = diskFreeBytesProxy();
      const error = FsErrorStub({ code: 'EACCES' });
      proxy.rejects({ path: '/repo/locked', error });

      await expect(diskFreeBytes('/repo/locked')).rejects.toBe(error);
    });
  });
});
