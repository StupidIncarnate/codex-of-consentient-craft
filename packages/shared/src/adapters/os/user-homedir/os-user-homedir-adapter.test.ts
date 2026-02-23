import { osUserHomedirAdapter } from './os-user-homedir-adapter';
import { osUserHomedirAdapterProxy } from './os-user-homedir-adapter.proxy';

describe('osUserHomedirAdapter', () => {
  describe('valid homedir', () => {
    it('VALID: {homedir: "/home/user"} => returns branded AbsoluteFilePath', () => {
      const proxy = osUserHomedirAdapterProxy();

      proxy.returns({ path: '/home/user' });

      const result = osUserHomedirAdapter();

      expect(result).toBe('/home/user');
    });

    it('VALID: {homedir: "/root"} => returns branded AbsoluteFilePath for root user', () => {
      const proxy = osUserHomedirAdapterProxy();

      proxy.returns({ path: '/root' });

      const result = osUserHomedirAdapter();

      expect(result).toBe('/root');
    });
  });

  describe('ignores DUNGEONMASTER_HOME', () => {
    it('VALID: {DUNGEONMASTER_HOME set} => returns os.homedir() not env var', () => {
      const proxy = osUserHomedirAdapterProxy();
      const originalEnv = process.env.DUNGEONMASTER_HOME;

      process.env.DUNGEONMASTER_HOME = '/tmp/dungeonmaster-data';
      proxy.returns({ path: '/home/real-user' });

      const result = osUserHomedirAdapter();

      process.env.DUNGEONMASTER_HOME = originalEnv;

      expect(result).toBe('/home/real-user');
    });
  });
});
