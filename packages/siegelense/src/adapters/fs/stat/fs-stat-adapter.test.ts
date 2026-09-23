import { fsStatAdapter } from './fs-stat-adapter';
import { fsStatAdapterProxy } from './fs-stat-adapter.proxy';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import { FileStatStub } from '../../../contracts/file-stat/file-stat.stub';

describe('fsStatAdapter', () => {
  describe('a file that exists', () => {
    it('VALID: {sizeBytes: 2048, modifiedAtMs: 1700000000000} => returns its size and modified time', async () => {
      const proxy = fsStatAdapterProxy();
      const filePath = AbsoluteFilePathStub({
        value: '/repo/.dungeonmaster-assets/siegelense-assets/run_2/step7.png',
      });
      proxy.resolves({ filePath, sizeBytes: 2048, modifiedAtMs: 1_700_000_000_000 });

      const result = await fsStatAdapter({ filePath });

      expect(result).toStrictEqual(
        FileStatStub({ sizeBytes: 2048, modifiedAtMs: 1_700_000_000_000 }),
      );
    });

    it('EDGE: {mtimeMs: 1700000000000.7} => floors sub-millisecond precision before branding', async () => {
      const proxy = fsStatAdapterProxy();
      const filePath = AbsoluteFilePathStub({
        value: '/repo/.dungeonmaster-assets/siegelense-assets/run_2/step8.png',
      });
      proxy.resolves({ filePath, sizeBytes: 1024, modifiedAtMs: 1_700_000_000_000.7 });

      const result = await fsStatAdapter({ filePath });

      expect(result).toStrictEqual(
        FileStatStub({ sizeBytes: 1024, modifiedAtMs: 1_700_000_000_000 }),
      );
    });
  });

  describe('a file that does not exist', () => {
    it('EMPTY: {ENOENT} => returns null', async () => {
      const proxy = fsStatAdapterProxy();
      const filePath = AbsoluteFilePathStub({
        value: '/repo/.dungeonmaster-assets/siegelense-assets/run_2/missing.png',
      });
      proxy.rejects({
        filePath,
        error: Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' }),
      });

      const result = await fsStatAdapter({ filePath });

      expect(result).toBe(null);
    });
  });

  describe('a file this process cannot read', () => {
    it('ERROR: {EACCES} => rejects rather than reporting a missing file', async () => {
      const proxy = fsStatAdapterProxy();
      const filePath = AbsoluteFilePathStub({
        value: '/repo/.dungeonmaster-assets/siegelense-assets/run_2/locked.png',
      });
      proxy.rejects({
        filePath,
        error: Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' }),
      });

      await expect(fsStatAdapter({ filePath })).rejects.toThrow(/EACCES/u);
    });
  });
});
