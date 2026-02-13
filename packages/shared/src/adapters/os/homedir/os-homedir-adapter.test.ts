import { osHomedirAdapter } from './os-homedir-adapter';
import { osHomedirAdapterProxy } from './os-homedir-adapter.proxy';

describe('osHomedirAdapter', () => {
  describe('valid homedir', () => {
    it('VALID: {homedir: "/home/user"} => returns branded AbsoluteFilePath', () => {
      const proxy = osHomedirAdapterProxy();

      proxy.returns({ path: '/home/user' });

      const result = osHomedirAdapter();

      expect(result).toBe('/home/user');
    });

    it('VALID: {homedir: "/root"} => returns branded AbsoluteFilePath for root user', () => {
      const proxy = osHomedirAdapterProxy();

      proxy.returns({ path: '/root' });

      const result = osHomedirAdapter();

      expect(result).toBe('/root');
    });
  });
});
