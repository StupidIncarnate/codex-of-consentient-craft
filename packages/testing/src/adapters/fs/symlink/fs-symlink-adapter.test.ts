import { fsSymlinkAdapter } from './fs-symlink-adapter';
import { fsSymlinkAdapterProxy } from './fs-symlink-adapter.proxy';

describe('fsSymlinkAdapter', () => {
  describe('successful creation', () => {
    it('VALID: {targetPath: "/tmp/target", linkPath: "/tmp/link"} => creates the symlink', () => {
      const proxy = fsSymlinkAdapterProxy();
      const targetPath = '/tmp/target';
      const linkPath = '/tmp/link';

      const result = fsSymlinkAdapter({ targetPath, linkPath });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getCallArgs()).toStrictEqual([[targetPath, linkPath, 'dir']]);
    });
  });

  describe('error cases', () => {
    it('ERROR: {linkPath: "/no-permission"} => throws permission error', () => {
      const proxy = fsSymlinkAdapterProxy();
      const targetPath = '/tmp/target';
      const linkPath = '/no-permission';

      proxy.throws({ targetPath, linkPath, error: new Error('EACCES: permission denied') });

      expect(() => {
        fsSymlinkAdapter({ targetPath, linkPath });
      }).toThrow(/EACCES/u);
    });
  });
});
