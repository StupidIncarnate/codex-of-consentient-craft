import { osUserHomedirAdapterProxy } from './os-user-homedir-adapter.proxy';
import { osUserHomedirAdapter } from './os-user-homedir-adapter';

describe('osUserHomedirAdapter', () => {
  describe('homedir resolution', () => {
    it('VALID: {} => returns branded AbsoluteFilePath', () => {
      const proxy = osUserHomedirAdapterProxy();
      proxy.returns({ path: '/home/testuser' });

      const result = osUserHomedirAdapter();

      expect(result).toBe('/home/testuser');
    });

    it('VALID: {default} => returns default path', () => {
      osUserHomedirAdapterProxy();

      const result = osUserHomedirAdapter();

      expect(result).toBe('/home/default');
    });
  });
});
