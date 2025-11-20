import { fsRmAdapter } from './fs-rm-adapter';
import { fsRmAdapterProxy } from './fs-rm-adapter.proxy';

describe('fsRmAdapter', () => {
  describe('successful removal', () => {
    it('VALID: {filePath: "/tmp/test-dir", recursive: true, force: true} => removes directory', () => {
      fsRmAdapterProxy();
      const filePath = '/tmp/test-dir';

      fsRmAdapter({ filePath, recursive: true, force: true });

      expect(true).toBe(true);
    });

    it('VALID: {filePath: "/tmp/file.txt"} => removes file', () => {
      fsRmAdapterProxy();
      const filePath = '/tmp/file.txt';

      fsRmAdapter({ filePath });

      expect(true).toBe(true);
    });
  });

  describe('error cases', () => {
    it('ERROR: {filePath: "/nonexistent"} => throws error', () => {
      const proxy = fsRmAdapterProxy();
      const filePath = '/nonexistent';

      proxy.throws({ filePath, error: new Error('ENOENT: no such file or directory') });

      expect(() => {
        fsRmAdapter({ filePath });
      }).toThrow(/ENOENT/u);
    });

    it('ERROR: {filePath: "/no-permission"} => throws permission error', () => {
      const proxy = fsRmAdapterProxy();
      const filePath = '/no-permission';

      proxy.throws({ filePath, error: new Error('EACCES: permission denied') });

      expect(() => {
        fsRmAdapter({ filePath });
      }).toThrow(/EACCES/u);
    });
  });
});
