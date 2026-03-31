import { fsMkdirAdapter } from './fs-mkdir-adapter';
import { fsMkdirAdapterProxy } from './fs-mkdir-adapter.proxy';

describe('fsMkdirAdapter', () => {
  describe('successful creation', () => {
    it('VALID: {dirPath: "/tmp/test-dir", recursive: true} => creates directory', () => {
      const proxy = fsMkdirAdapterProxy();
      const dirPath = '/tmp/test-dir';

      fsMkdirAdapter({ dirPath, recursive: true });

      expect(proxy.getCallArgs()).toStrictEqual([[dirPath, { recursive: true }]]);
    });

    it('VALID: {dirPath: "/tmp/simple"} => creates directory without recursive', () => {
      const proxy = fsMkdirAdapterProxy();
      const dirPath = '/tmp/simple';

      fsMkdirAdapter({ dirPath });

      expect(proxy.getCallArgs()).toStrictEqual([[dirPath, { recursive: undefined }]]);
    });
  });

  describe('error cases', () => {
    it('ERROR: {dirPath: "/invalid/path"} => throws error', () => {
      const proxy = fsMkdirAdapterProxy();
      const dirPath = '/invalid/path';

      proxy.throws({ dirPath, error: new Error('ENOENT: no such file or directory') });

      expect(() => {
        fsMkdirAdapter({ dirPath });
      }).toThrow(/ENOENT/u);
    });

    it('ERROR: {dirPath: "/no-permission"} => throws permission error', () => {
      const proxy = fsMkdirAdapterProxy();
      const dirPath = '/no-permission';

      proxy.throws({ dirPath, error: new Error('EACCES: permission denied') });

      expect(() => {
        fsMkdirAdapter({ dirPath });
      }).toThrow(/EACCES/u);
    });
  });
});
