import { fsReaddirAdapter } from './fs-readdir-adapter';
import { fsReaddirAdapterProxy } from './fs-readdir-adapter.proxy';
import { FileNameStub } from '../../../contracts/file-name/file-name.stub';

describe('fsReaddirAdapter', () => {
  describe('reading directory success', () => {
    it('VALID: {dirPath: "/quests"} => returns array of file names', () => {
      const proxy = fsReaddirAdapterProxy();
      const files = [
        FileNameStub({ value: 'quest-1.json' }),
        FileNameStub({ value: 'quest-2.json' }),
      ];

      proxy.returns({ files });

      const result = fsReaddirAdapter({ dirPath: '/quests' });

      expect(result).toStrictEqual(files);
    });

    it('VALID: {dirPath: "/empty"} => returns empty array for empty directory', () => {
      const proxy = fsReaddirAdapterProxy();

      proxy.returns({ files: [] });

      const result = fsReaddirAdapter({ dirPath: '/empty' });

      expect(result).toStrictEqual([]);
    });
  });

  describe('reading directory failure', () => {
    it('ERROR: {dirPath: "/missing"} => throws error when directory does not exist', () => {
      const proxy = fsReaddirAdapterProxy();
      const error = new Error('ENOENT: no such file or directory');

      proxy.throws({ error });

      expect(() => fsReaddirAdapter({ dirPath: '/missing' })).toThrow(error);
    });
  });
});
