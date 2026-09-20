import { fsWriteFileAdapter } from './fs-write-file-adapter';
import { fsWriteFileAdapterProxy } from './fs-write-file-adapter.proxy';
import { AbsoluteFilePathStub, FileContentsStub } from '@dungeonmaster/shared/contracts';

describe('fsWriteFileAdapter', () => {
  describe('successful writes', () => {
    it('VALID: {filePath, contents} => writes the file successfully', async () => {
      const proxy = fsWriteFileAdapterProxy();
      const filePath = AbsoluteFilePathStub({
        value: '/home/user/.dungeonmaster/siegelense/registry.json.tmp',
      });
      const contents = FileContentsStub({ value: '{"instances":[]}' });

      proxy.succeeds({ filePath });

      await expect(fsWriteFileAdapter({ filePath, contents })).resolves.toStrictEqual({
        success: true,
      });
    });

    it('VALID: {filePath, contents} => writes the exact contents to that path', async () => {
      const proxy = fsWriteFileAdapterProxy();
      const filePath = AbsoluteFilePathStub({
        value: '/home/user/.dungeonmaster/siegelense/registry.json.tmp',
      });
      const contents = FileContentsStub({ value: '{"instances":[]}' });

      proxy.succeeds({ filePath });

      await fsWriteFileAdapter({ filePath, contents });

      expect(proxy.getWrittenFor({ filePath })).toBe(contents);
    });

    it('VALID: {filePath, contents} => uses the overwrite flag by default', async () => {
      const proxy = fsWriteFileAdapterProxy();
      const filePath = AbsoluteFilePathStub({
        value: '/home/user/.dungeonmaster/siegelense/registry.json.tmp',
      });
      const contents = FileContentsStub({ value: '{"instances":[]}' });

      proxy.succeeds({ filePath });

      await fsWriteFileAdapter({ filePath, contents });

      expect(proxy.getFlagFor({ filePath })).toBe('w');
    });
  });

  describe('exclusive writes', () => {
    it('VALID: {filePath, contents, exclusive: true} => uses the exclusive create flag', async () => {
      const proxy = fsWriteFileAdapterProxy();
      const filePath = AbsoluteFilePathStub({
        value: '/home/user/.dungeonmaster/siegelense/boot.lock',
      });
      const contents = FileContentsStub({ value: '{"heldBy":"inst_1a2b3c4d"}' });

      proxy.succeeds({ filePath });

      await fsWriteFileAdapter({ filePath, contents, exclusive: true });

      expect(proxy.getFlagFor({ filePath })).toBe('wx');
    });

    it('ERROR: {filePath: already exists, exclusive: true} => rejects with EEXIST', async () => {
      const proxy = fsWriteFileAdapterProxy();
      const filePath = AbsoluteFilePathStub({
        value: '/home/user/.dungeonmaster/siegelense/boot.lock',
      });
      const contents = FileContentsStub({ value: '{"heldBy":"inst_1a2b3c4d"}' });

      proxy.throws({
        filePath,
        error: Object.assign(new Error('EEXIST: file already exists'), { code: 'EEXIST' }),
      });

      await expect(fsWriteFileAdapter({ filePath, contents, exclusive: true })).rejects.toThrow(
        /EEXIST/u,
      );
    });
  });

  describe('error cases', () => {
    it('ERROR: {filePath: readonly path} => throws permission denied error', async () => {
      const proxy = fsWriteFileAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/readonly/siegelense/registry.json.tmp' });
      const contents = FileContentsStub({ value: '{"instances":[]}' });

      proxy.throws({ filePath, error: new Error('EACCES: permission denied') });

      await expect(fsWriteFileAdapter({ filePath, contents })).rejects.toThrow(/EACCES/u);
    });
  });
});
