import { fsReadFileAdapter } from './fs-read-file-adapter';
import { fsReadFileAdapterProxy } from './fs-read-file-adapter.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';

describe('fsReadFileAdapter', () => {
  describe('successful operations', () => {
    it("VALID: {filePath: '/path/to/file.txt'} => returns file content", async () => {
      const proxy = fsReadFileAdapterProxy();
      const filePath = FilePathStub({ value: '/path/to/file.txt' });
      const expectedContent = FileContentsStub({ value: 'file content here' });

      proxy.returns({ contents: expectedContent });

      const result = await fsReadFileAdapter({ filePath });

      expect(result).toStrictEqual(expectedContent);
    });

    it("VALID: {filePath: './relative/path/config.json'} => returns JSON content", async () => {
      const proxy = fsReadFileAdapterProxy();
      const filePath = FilePathStub({ value: './relative/path/config.json' });
      const jsonContent = FileContentsStub({ value: '{"key": "value", "number": 42}' });

      proxy.returns({ contents: jsonContent });

      const result = await fsReadFileAdapter({ filePath });

      expect(result).toStrictEqual(jsonContent);
    });

    it("VALID: {filePath: '/absolute/path/empty.txt'} => returns empty string", async () => {
      const proxy = fsReadFileAdapterProxy();
      const filePath = FilePathStub({ value: '/absolute/path/empty.txt' });
      const expectedContent = FileContentsStub({ value: '' });

      proxy.returns({ contents: expectedContent });

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

      proxy.throws({ error: fileNotFoundError });

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

      proxy.throws({ error: permissionError });

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

      proxy.throws({ error: isDirError });

      await expect(fsReadFileAdapter({ filePath })).rejects.toThrow(
        `Failed to read file at ${filePath}`,
      );
    });
  });

  describe('edge cases', () => {
    it("EDGE: {filePath: '/current/directory'} => throws wrapped error with context", async () => {
      const proxy = fsReadFileAdapterProxy();
      const filePath = FilePathStub({ value: '/current/directory' });
      const currentDirError = Object.assign(new Error('EISDIR: illegal operation on a directory'), {
        code: 'EISDIR',
      });

      proxy.throws({ error: currentDirError });

      await expect(fsReadFileAdapter({ filePath })).rejects.toThrow(
        `Failed to read file at ${filePath}`,
      );
    });

    it("EDGE: {filePath: '/path/with/unicode/файл.txt'} => returns unicode content", async () => {
      const proxy = fsReadFileAdapterProxy();
      const filePath = FilePathStub({ value: '/path/with/unicode/файл.txt' });
      const unicodeContent = FileContentsStub({
        value: '🚀 Unicode content with специальные символы',
      });

      proxy.returns({ contents: unicodeContent });

      const result = await fsReadFileAdapter({ filePath });

      expect(result).toStrictEqual(unicodeContent);
    });
  });
});
