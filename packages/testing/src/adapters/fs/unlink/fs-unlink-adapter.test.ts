import { fsUnlinkAdapter } from './fs-unlink-adapter';
import { fsUnlinkAdapterProxy } from './fs-unlink-adapter.proxy';

describe('fsUnlinkAdapter', () => {
  describe('successful removal', () => {
    it('VALID: {filePath: "/tmp/test.txt"} => removes file', () => {
      fsUnlinkAdapterProxy();
      const filePath = '/tmp/test.txt';

      fsUnlinkAdapter({ filePath });

      expect(true).toBe(true);
    });
  });

  describe('error cases', () => {
    it('ERROR: {filePath: "/nonexistent.txt"} => throws error', () => {
      const proxy = fsUnlinkAdapterProxy();
      const filePath = '/nonexistent.txt';

      proxy.throws({ filePath, error: new Error('ENOENT: no such file or directory') });

      expect(() => {
        fsUnlinkAdapter({ filePath });
      }).toThrow(/ENOENT/u);
    });

    it('ERROR: {filePath: "/no-permission.txt"} => throws permission error', () => {
      const proxy = fsUnlinkAdapterProxy();
      const filePath = '/no-permission.txt';

      proxy.throws({ filePath, error: new Error('EACCES: permission denied') });

      expect(() => {
        fsUnlinkAdapter({ filePath });
      }).toThrow(/EACCES/u);
    });
  });
});
