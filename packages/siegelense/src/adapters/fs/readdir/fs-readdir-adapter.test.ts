import { fsReaddirAdapter } from './fs-readdir-adapter';
import { fsReaddirAdapterProxy } from './fs-readdir-adapter.proxy';
import { AbsoluteFilePathStub, FileNameStub } from '@dungeonmaster/shared/contracts';

describe('fsReaddirAdapter', () => {
  describe('a directory with entries', () => {
    it('VALID: {dir with three files} => returns all three file names', async () => {
      const proxy = fsReaddirAdapterProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/repo/.siegelense/guilds/g1' });
      proxy.resolves({ dirPath, entries: ['a.json', 'b.json', 'c.json'] });

      const result = await fsReaddirAdapter({ dirPath });

      expect(result).toStrictEqual([
        FileNameStub({ value: 'a.json' }),
        FileNameStub({ value: 'b.json' }),
        FileNameStub({ value: 'c.json' }),
      ]);
    });
  });

  describe('a directory that does not exist', () => {
    it('EMPTY: {ENOENT} => returns an empty list', async () => {
      const proxy = fsReaddirAdapterProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/repo/.siegelense/guilds/missing' });
      proxy.rejects({
        dirPath,
        error: Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' }),
      });

      const result = await fsReaddirAdapter({ dirPath });

      expect(result).toStrictEqual([]);
    });
  });

  describe('a directory this process cannot read', () => {
    it('ERROR: {EACCES} => rejects rather than reporting an empty machine', async () => {
      const proxy = fsReaddirAdapterProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/repo/.siegelense/guilds/locked' });
      proxy.rejects({
        dirPath,
        error: Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' }),
      });

      await expect(fsReaddirAdapter({ dirPath })).rejects.toThrow(/EACCES/u);
    });
  });
});
