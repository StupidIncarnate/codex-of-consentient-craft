import { fsReadFileAdapter } from './fs-read-file-adapter';
import { fsReadFileAdapterProxy } from './fs-read-file-adapter.proxy';
import { FilePathStub, FileContentsStub } from '@dungeonmaster/shared/contracts';

describe('fsReadFileAdapter', () => {
  describe('successful operations', () => {
    it("VALID: {filePath: '/quest.json'} => returns file content", async () => {
      const proxy = fsReadFileAdapterProxy();
      const filePath = FilePathStub({ value: '/quest.json' });
      const expectedContent = FileContentsStub({ value: '{"name":"test quest"}' });

      proxy.resolves({ content: expectedContent });

      const result = await fsReadFileAdapter({ filePath });

      expect(result).toStrictEqual(expectedContent);
    });

    it("VALID: {filePath: './relative/path/quest.json'} => returns JSON content", async () => {
      const proxy = fsReadFileAdapterProxy();
      const filePath = FilePathStub({ value: './relative/path/quest.json' });
      const jsonContent = FileContentsStub({ value: '{"id": "quest-1", "status": "active"}' });

      proxy.resolves({ content: jsonContent });

      const result = await fsReadFileAdapter({ filePath });

      expect(result).toStrictEqual(jsonContent);
    });

    it("VALID: {filePath: '/absolute/path/empty.txt'} => returns empty string", async () => {
      const proxy = fsReadFileAdapterProxy();
      const filePath = FilePathStub({ value: '/absolute/path/empty.txt' });
      const expectedContent = FileContentsStub({ value: '' });

      proxy.resolves({ content: expectedContent });

      const result = await fsReadFileAdapter({ filePath });

      expect(result).toStrictEqual(expectedContent);
    });
  });

  describe('error conditions', () => {
    it("ERROR: {filePath: '/non/existent/file.txt'} => throws wrapped error with context", async () => {
      const proxy = fsReadFileAdapterProxy();
      const filePath = FilePathStub({ value: '/non/existent/file.txt' });
      const fileNotFoundError = Object.assign(new Error('ENOENT: no such file or directory'), {
        code: 'ENOENT',
      });

      proxy.rejects({ error: fileNotFoundError });

      await expect(fsReadFileAdapter({ filePath })).rejects.toThrow(
        `Failed to read file at ${filePath}`,
      );
    });

    it("ERROR: {filePath: '/restricted/file.txt'} => throws wrapped error with context", async () => {
      const proxy = fsReadFileAdapterProxy();
      const filePath = FilePathStub({ value: '/restricted/file.txt' });
      const permissionError = Object.assign(new Error('EACCES: permission denied'), {
        code: 'EACCES',
      });

      proxy.rejects({ error: permissionError });

      await expect(fsReadFileAdapter({ filePath })).rejects.toThrow(
        `Failed to read file at ${filePath}`,
      );
    });

    it("ERROR: {filePath: '/path/to/directory'} => throws wrapped error with context", async () => {
      const proxy = fsReadFileAdapterProxy();
      const filePath = FilePathStub({ value: '/path/to/directory' });
      const isDirError = Object.assign(new Error('EISDIR: illegal operation on a directory'), {
        code: 'EISDIR',
      });

      proxy.rejects({ error: isDirError });

      await expect(fsReadFileAdapter({ filePath })).rejects.toThrow(
        `Failed to read file at ${filePath}`,
      );
    });
  });

  describe('edge cases', () => {
    it("EDGE: {filePath: '/path/with/unicode/файл.txt'} => returns unicode content", async () => {
      const proxy = fsReadFileAdapterProxy();
      const filePath = FilePathStub({ value: '/path/with/unicode/файл.txt' });
      const unicodeContent = FileContentsStub({
        value: 'Unicode content with специальные символы',
      });

      proxy.resolves({ content: unicodeContent });

      const result = await fsReadFileAdapter({ filePath });

      expect(result).toStrictEqual(unicodeContent);
    });
  });
});
