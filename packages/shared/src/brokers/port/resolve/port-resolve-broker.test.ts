import { portResolveBroker } from './port-resolve-broker';
import { portResolveBrokerProxy } from './port-resolve-broker.proxy';

describe('portResolveBroker', () => {
  describe('DUNGEONMASTER_PORT env var', () => {
    it('VALID: env: "5000", config has 4800 => returns 5000 (env wins)', () => {
      const proxy = portResolveBrokerProxy();
      proxy.setEnvPort({ value: '5000' });
      proxy.setupConfigPort({ startDir: '/project', port: 4800 });

      const result = portResolveBroker({
        startDir: '/project',
      });

      proxy.clearEnvPort();

      expect(result).toBe(5000);
    });

    it('VALID: env: "not-a-number", config has 4800 => falls through to config', () => {
      const proxy = portResolveBrokerProxy();
      proxy.setEnvPort({ value: 'not-a-number' });
      proxy.setupConfigPort({ startDir: '/project', port: 4800 });

      const result = portResolveBroker({
        startDir: '/project',
      });

      proxy.clearEnvPort();

      expect(result).toBe(4800);
    });

    it('VALID: env: "", config has 4800 => falls through to config', () => {
      const proxy = portResolveBrokerProxy();
      proxy.setEnvPort({ value: '' });
      proxy.setupConfigPort({ startDir: '/project', port: 4800 });

      const result = portResolveBroker({
        startDir: '/project',
      });

      proxy.clearEnvPort();

      expect(result).toBe(4800);
    });
  });

  describe('config fallback', () => {
    it('VALID: env unset, config has 4800 => returns 4800', () => {
      const proxy = portResolveBrokerProxy();
      proxy.clearEnvPort();
      proxy.setupConfigPort({ startDir: '/project', port: 4800 });

      const result = portResolveBroker({
        startDir: '/project',
      });

      expect(result).toBe(4800);
    });
  });

  describe('default fallback', () => {
    it('VALID: env unset, no config found => returns defaultPort (3737)', () => {
      const proxy = portResolveBrokerProxy();
      proxy.clearEnvPort();
      proxy.setupNoConfig({ startDir: '/no-config' });

      const result = portResolveBroker({
        startDir: '/no-config',
      });

      expect(result).toBe(3737);
    });
  });
});
