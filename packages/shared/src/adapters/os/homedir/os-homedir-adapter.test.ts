import { osHomedirAdapter } from './os-homedir-adapter';
import { osHomedirAdapterProxy } from './os-homedir-adapter.proxy';

describe('osHomedirAdapter', () => {
  describe('valid homedir', () => {
    it('VALID: {homedir: "/home/user"} => returns branded AbsoluteFilePath', () => {
      const proxy = osHomedirAdapterProxy();

      proxy.clearEnvHome();
      proxy.returns({ path: '/home/user' });

      const result = osHomedirAdapter();

      expect(result).toBe('/home/user');
    });

    it('VALID: {homedir: "/root"} => returns branded AbsoluteFilePath for root user', () => {
      const proxy = osHomedirAdapterProxy();

      proxy.clearEnvHome();
      proxy.returns({ path: '/root' });

      const result = osHomedirAdapter();

      expect(result).toBe('/root');
    });
  });

  describe('DUNGEONMASTER_HOME env override', () => {
    it('VALID: {DUNGEONMASTER_HOME: "/tmp/test-home"} => returns env path instead of os.homedir()', () => {
      const proxy = osHomedirAdapterProxy();

      proxy.setEnvHome({ path: '/tmp/test-home' });

      const result = osHomedirAdapter();

      proxy.clearEnvHome();

      expect(result).toBe('/tmp/test-home');
    });
  });
});
