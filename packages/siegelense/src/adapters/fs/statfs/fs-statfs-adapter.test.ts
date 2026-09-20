import { fsStatfsAdapter } from './fs-statfs-adapter';
import { fsStatfsAdapterProxy } from './fs-statfs-adapter.proxy';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

describe('fsStatfsAdapter', () => {
  describe('a readable filesystem', () => {
    it('VALID: {bavail: 512000, bsize: 4096} => returns 2000', async () => {
      const proxy = fsStatfsAdapterProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/home/user/.dungeonmaster' });
      proxy.resolves({ dirPath, bavail: 512_000, bsize: 4096 });

      const result = await fsStatfsAdapter({ dirPath });

      expect(result).toBe(2000);
    });

    it('VALID: {bavail: 100, bsize: 512} => floors a fractional megabyte down rather than rounding up', async () => {
      const proxy = fsStatfsAdapterProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/home/user/.dungeonmaster' });
      proxy.resolves({ dirPath, bavail: 100, bsize: 512 });

      const result = await fsStatfsAdapter({ dirPath });

      expect(result).toBe(0);
    });
  });

  describe('a filesystem this process cannot read', () => {
    it('ERROR: {EACCES} => rejects rather than reporting no free space information', async () => {
      const proxy = fsStatfsAdapterProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/home/user/.dungeonmaster' });
      proxy.rejects({
        dirPath,
        error: Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' }),
      });

      await expect(fsStatfsAdapter({ dirPath })).rejects.toThrow(/EACCES/u);
    });
  });
});
