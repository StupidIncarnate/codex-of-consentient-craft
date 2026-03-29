import { fsAppendFileAdapter } from './fs-append-file-adapter';
import { fsAppendFileAdapterProxy } from './fs-append-file-adapter.proxy';
import { FilePathStub, FileContentsStub } from '@dungeonmaster/shared/contracts';

describe('fsAppendFileAdapter', () => {
  describe('successful appends', () => {
    it('VALID: {filePath: "/test.jsonl", contents: "data"} => appends file successfully', async () => {
      const proxy = fsAppendFileAdapterProxy();
      const filePath = FilePathStub({ value: '/test.jsonl' });
      const contents = FileContentsStub({ value: '{"line": "data"}\n' });

      proxy.succeeds();

      await expect(fsAppendFileAdapter({ filePath, contents })).resolves.toBe(undefined);
    });

    it('VALID: {filePath: "/log.txt", contents: "entry"} => appends with correct path and content', async () => {
      const proxy = fsAppendFileAdapterProxy();
      const filePath = FilePathStub({ value: '/log.txt' });
      const contents = FileContentsStub({ value: 'log entry\n' });

      proxy.succeeds();

      await fsAppendFileAdapter({ filePath, contents });

      expect(proxy.getAppendedPath()).toBe(filePath);
      expect(proxy.getAppendedContent()).toBe(contents);
    });
  });

  describe('error cases', () => {
    it('ERROR: {filePath: "/readonly.txt"} => throws permission denied error', async () => {
      const proxy = fsAppendFileAdapterProxy();
      const filePath = FilePathStub({ value: '/readonly.txt' });
      const contents = FileContentsStub({ value: 'test' });

      proxy.throws({ error: new Error('EACCES: permission denied') });

      await expect(fsAppendFileAdapter({ filePath, contents })).rejects.toThrow(/EACCES/u);
    });

    it('ERROR: {filePath: "/nonexistent/file.txt"} => throws no such file error', async () => {
      const proxy = fsAppendFileAdapterProxy();
      const filePath = FilePathStub({ value: '/nonexistent/file.txt' });
      const contents = FileContentsStub({ value: 'test' });

      proxy.throws({ error: new Error('ENOENT: no such file or directory') });

      await expect(fsAppendFileAdapter({ filePath, contents })).rejects.toThrow(/ENOENT/u);
    });
  });
});
