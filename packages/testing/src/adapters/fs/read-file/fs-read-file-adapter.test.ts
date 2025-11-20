import { fsReadFileAdapter } from './fs-read-file-adapter';
import { fsReadFileAdapterProxy } from './fs-read-file-adapter.proxy';
import { FileContentStub } from '../../../contracts/file-content/file-content.stub';

describe('fsReadFileAdapter', () => {
  describe('successful reads', () => {
    it('VALID: {filePath: "/tmp/test.txt"} => returns file content', () => {
      const proxy = fsReadFileAdapterProxy();
      const filePath = '/tmp/test.txt';
      const content = FileContentStub({ value: 'hello world' });

      proxy.returns({ filePath, content });

      const result = fsReadFileAdapter({ filePath });

      expect(result).toStrictEqual(FileContentStub({ value: 'hello world' }));
    });

    it('VALID: {filePath: "/tmp/empty.txt"} => returns empty content', () => {
      const proxy = fsReadFileAdapterProxy();
      const filePath = '/tmp/empty.txt';
      const content = FileContentStub({ value: '' });

      proxy.returns({ filePath, content });

      const result = fsReadFileAdapter({ filePath });

      expect(result).toStrictEqual(FileContentStub({ value: '' }));
    });
  });

  describe('error cases', () => {
    it('ERROR: {filePath: "/nonexistent.txt"} => throws file not found error', () => {
      const proxy = fsReadFileAdapterProxy();
      const filePath = '/nonexistent.txt';

      proxy.throws({ filePath, error: new Error('ENOENT: no such file or directory') });

      expect(() => {
        fsReadFileAdapter({ filePath });
      }).toThrow(/ENOENT/u);
    });

    it('ERROR: {filePath: "/no-permission.txt"} => throws permission denied error', () => {
      const proxy = fsReadFileAdapterProxy();
      const filePath = '/no-permission.txt';

      proxy.throws({ filePath, error: new Error('EACCES: permission denied') });

      expect(() => {
        fsReadFileAdapter({ filePath });
      }).toThrow(/EACCES/u);
    });
  });
});
