import { Dirent } from 'fs';
import { fsReaddirWithTypesAdapter } from './fs-readdir-with-types-adapter';
import { fsReaddirWithTypesAdapterProxy } from './fs-readdir-with-types-adapter.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

describe('fsReaddirWithTypesAdapter', () => {
  describe('successful reads', () => {
    it('VALID: {dirPath: "/home/user/.dungeonmaster"} => returns directory entries', () => {
      const proxy = fsReaddirWithTypesAdapterProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/home/user/.dungeonmaster' });
      const projectEntry = Object.assign(Object.create(Dirent.prototype) as Dirent, {
        name: 'projects',
        parentPath: '/home/user/.dungeonmaster',
      });

      proxy.returns({ entries: [projectEntry] });

      const result = fsReaddirWithTypesAdapter({ dirPath });

      expect(result).toStrictEqual([projectEntry]);
    });

    it('EMPTY: {dirPath: "/home/user/.dungeonmaster"} => returns empty array for empty directory', () => {
      const proxy = fsReaddirWithTypesAdapterProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/home/user/.dungeonmaster' });

      proxy.returns({ entries: [] });

      const result = fsReaddirWithTypesAdapter({ dirPath });

      expect(result).toStrictEqual([]);
    });
  });

  describe('error cases', () => {
    it('ERROR: {dirPath: "/nonexistent"} => throws directory not found error', () => {
      const proxy = fsReaddirWithTypesAdapterProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/nonexistent' });

      proxy.throws({ error: new Error('ENOENT: no such file or directory') });

      expect(() => fsReaddirWithTypesAdapter({ dirPath })).toThrow(/ENOENT/u);
    });
  });
});
