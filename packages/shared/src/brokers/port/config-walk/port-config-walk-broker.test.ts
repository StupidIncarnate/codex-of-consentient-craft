import { portConfigWalkBroker } from './port-config-walk-broker';
import { portConfigWalkBrokerProxy } from './port-config-walk-broker.proxy';

describe('portConfigWalkBroker', () => {
  describe('config found in starting dir', () => {
    it('VALID: {dir: "/project", config has port 4800} => returns 4800', () => {
      const proxy = portConfigWalkBrokerProxy();
      proxy.setupPortFound({ dir: '/project', port: 4800 });

      const result = portConfigWalkBroker({
        dir: '/project',
      });

      expect(result).toBe(4800);
    });
  });

  describe('config found in parent dir', () => {
    it('VALID: config at parent with port 4750 => walks up and returns 4750', () => {
      const proxy = portConfigWalkBrokerProxy();
      proxy.setupPortFoundInParent({
        startDir: '/project/packages/web',
        parentDir: '/project/packages',
        port: 4750,
      });

      const result = portConfigWalkBroker({
        dir: '/project/packages/web',
      });

      expect(result).toBe(4750);
    });
  });

  describe('no config found', () => {
    it('VALID: {dir: "/no-config"} walks to root and returns undefined', () => {
      const proxy = portConfigWalkBrokerProxy();
      proxy.setupWalkToRoot({ startDir: '/no-config' });

      const result = portConfigWalkBroker({
        dir: '/no-config',
      });

      expect(result).toBe(undefined);
    });
  });
});
