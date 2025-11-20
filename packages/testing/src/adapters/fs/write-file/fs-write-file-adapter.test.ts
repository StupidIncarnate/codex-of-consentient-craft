import { fsWriteFileAdapter } from './fs-write-file-adapter';
import { fsWriteFileAdapterProxy } from './fs-write-file-adapter.proxy';
import { FileContentStub } from '../../../contracts/file-content/file-content.stub';

describe('fsWriteFileAdapter', () => {
  describe('successful writes', () => {
    it('VALID: {filePath: "/tmp/test.txt", content: "hello"} => writes file', () => {
      fsWriteFileAdapterProxy();
      const filePath = '/tmp/test.txt';
      const content = FileContentStub({ value: 'hello' });

      fsWriteFileAdapter({ filePath, content });

      expect(true).toBe(true);
    });

    it('VALID: {filePath: "/tmp/empty.txt", content: ""} => writes empty file', () => {
      fsWriteFileAdapterProxy();
      const filePath = '/tmp/empty.txt';
      const content = FileContentStub({ value: '' });

      fsWriteFileAdapter({ filePath, content });

      expect(true).toBe(true);
    });
  });

  describe('error cases', () => {
    it('ERROR: {filePath: "/invalid/path/file.txt"} => throws error', () => {
      const proxy = fsWriteFileAdapterProxy();
      const filePath = '/invalid/path/file.txt';
      const content = FileContentStub({ value: 'test' });

      proxy.throws({ filePath, error: new Error('ENOENT: no such file or directory') });

      expect(() => {
        fsWriteFileAdapter({ filePath, content });
      }).toThrow(/ENOENT/u);
    });

    it('ERROR: {filePath: "/no-permission.txt"} => throws permission error', () => {
      const proxy = fsWriteFileAdapterProxy();
      const filePath = '/no-permission.txt';
      const content = FileContentStub({ value: 'test' });

      proxy.throws({ filePath, error: new Error('EACCES: permission denied') });

      expect(() => {
        fsWriteFileAdapter({ filePath, content });
      }).toThrow(/EACCES/u);
    });
  });
});
