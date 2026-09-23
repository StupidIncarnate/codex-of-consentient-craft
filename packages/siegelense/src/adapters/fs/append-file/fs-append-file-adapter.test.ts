import { fsAppendFileAdapter } from './fs-append-file-adapter';
import { fsAppendFileAdapterProxy } from './fs-append-file-adapter.proxy';
import { AbsoluteFilePathStub, FileContentsStub } from '@dungeonmaster/shared/contracts';

describe('fsAppendFileAdapter', () => {
  describe('successful appends', () => {
    it('VALID: {filePath, contents} => appends the file successfully', async () => {
      const proxy = fsAppendFileAdapterProxy();
      const filePath = AbsoluteFilePathStub({
        value: '/repo/.dungeonmaster-assets/siegelense-assets/runs/run_2.jsonl',
      });
      const contents = FileContentsStub({ value: '{"step":1}\n' });

      proxy.succeeds({ filePath });

      await expect(fsAppendFileAdapter({ filePath, contents })).resolves.toStrictEqual({
        success: true,
      });
    });

    it('VALID: {filePath, two flushes} => appends both chunks in order', async () => {
      const proxy = fsAppendFileAdapterProxy();
      const filePath = AbsoluteFilePathStub({
        value: '/repo/.dungeonmaster-assets/siegelense-assets/runs/run_2.jsonl',
      });
      const first = FileContentsStub({ value: '{"step":1}\n' });
      const second = FileContentsStub({ value: '{"step":2}\n' });

      proxy.succeeds({ filePath });

      await fsAppendFileAdapter({ filePath, contents: first });
      await fsAppendFileAdapter({ filePath, contents: second });

      expect(proxy.getAppendedFor({ filePath })).toStrictEqual([first, second]);
    });
  });

  describe('error cases', () => {
    it('ERROR: {filePath: readonly path} => throws permission denied error', async () => {
      const proxy = fsAppendFileAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/readonly/runs/run_2.jsonl' });
      const contents = FileContentsStub({ value: '{"step":1}\n' });

      proxy.throws({ filePath, error: new Error('EACCES: permission denied') });

      await expect(fsAppendFileAdapter({ filePath, contents })).rejects.toThrow(/EACCES/u);
    });
  });
});
