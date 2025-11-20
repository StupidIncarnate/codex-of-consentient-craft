import { fsReaddirAdapter } from './fs-readdir-adapter';
import { fsReaddirAdapterProxy } from './fs-readdir-adapter.proxy';
import { FileNameStub } from '../../../contracts/file-name/file-name.stub';

describe('fsReaddirAdapter', () => {
  describe('successful reads', () => {
    it('VALID: {dirPath: "/tmp/test-dir"} => returns array of file names', () => {
      const proxy = fsReaddirAdapterProxy();
      const dirPath = '/tmp/test-dir';
      const files = [FileNameStub({ value: 'file1.txt' }), FileNameStub({ value: 'file2.txt' })];

      proxy.returns({ dirPath, files });

      const result = fsReaddirAdapter({ dirPath });

      expect(result).toStrictEqual([
        FileNameStub({ value: 'file1.txt' }),
        FileNameStub({ value: 'file2.txt' }),
      ]);
    });

    it('VALID: {dirPath: "/tmp/empty-dir"} => returns empty array', () => {
      const proxy = fsReaddirAdapterProxy();
      const dirPath = '/tmp/empty-dir';
      const files: ReturnType<typeof FileNameStub>[] = [];

      proxy.returns({ dirPath, files });

      const result = fsReaddirAdapter({ dirPath });

      expect(result).toStrictEqual([]);
    });
  });

  describe('error cases', () => {
    it('ERROR: {dirPath: "/nonexistent"} => throws error', () => {
      const proxy = fsReaddirAdapterProxy();
      const dirPath = '/nonexistent';

      proxy.throws({ dirPath, error: new Error('ENOENT: no such file or directory') });

      expect(() => {
        fsReaddirAdapter({ dirPath });
      }).toThrow(/ENOENT/u);
    });

    it('ERROR: {dirPath: "/no-permission"} => throws permission error', () => {
      const proxy = fsReaddirAdapterProxy();
      const dirPath = '/no-permission';

      proxy.throws({ dirPath, error: new Error('EACCES: permission denied') });

      expect(() => {
        fsReaddirAdapter({ dirPath });
      }).toThrow(/EACCES/u);
    });
  });
});
