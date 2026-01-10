import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { fsRealpathAdapter } from './fs-realpath-adapter';
import { fsRealpathAdapterProxy } from './fs-realpath-adapter.proxy';

describe('fsRealpathAdapter', () => {
  describe('successful resolution', () => {
    it('VALID: {filePath: "/path/to/file"} => returns resolved path', () => {
      const proxy = fsRealpathAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/path/to/symlink' });
      const resolvedPath = AbsoluteFilePathStub({ value: '/path/to/real/file' });
      proxy.resolves({ resolvedPath });

      const result = fsRealpathAdapter({ filePath });

      expect(result).toBe(resolvedPath);
    });

    it('VALID: {filePath: "/already/real"} => returns same path when no symlink', () => {
      const proxy = fsRealpathAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/already/real/path' });
      proxy.resolves({ resolvedPath: filePath });

      const result = fsRealpathAdapter({ filePath });

      expect(result).toBe(filePath);
    });
  });

  describe('error handling', () => {
    it('ERROR: {filePath: nonexistent} => returns original path on ENOENT', () => {
      const proxy = fsRealpathAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/nonexistent/path' });
      proxy.throws({ error: new Error('ENOENT: no such file or directory') });

      const result = fsRealpathAdapter({ filePath });

      expect(result).toBe(filePath);
    });

    it('ERROR: {filePath: no permission} => returns original path on EACCES', () => {
      const proxy = fsRealpathAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/no/permission/path' });
      proxy.throws({ error: new Error('EACCES: permission denied') });

      const result = fsRealpathAdapter({ filePath });

      expect(result).toBe(filePath);
    });
  });
});
