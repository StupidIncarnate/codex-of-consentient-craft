import { processIsAliveBroker } from './process-is-alive-broker';
import { processIsAliveBrokerProxy } from './process-is-alive-broker.proxy';

describe('processIsAliveBroker', () => {
  describe('probe answers', () => {
    it('VALID: {pid whose probe succeeds} => returns true', () => {
      const proxy = processIsAliveBrokerProxy();
      const pid = 812325;
      proxy.setupAlive({ pid });

      expect(processIsAliveBroker({ pid })).toBe(true);
    });

    it('VALID: {pid whose probe raises ESRCH} => returns false', () => {
      const proxy = processIsAliveBrokerProxy();
      const pid = 4_999_999;
      proxy.setupDead({ pid });

      expect(processIsAliveBroker({ pid })).toBe(false);
    });

    it('VALID: {pid whose probe raises EPERM} => returns true', () => {
      const proxy = processIsAliveBrokerProxy();
      const pid = 1;
      proxy.setupPermissionDenied({ pid });

      expect(processIsAliveBroker({ pid })).toBe(true);
    });
  });

  describe('unreadable failure', () => {
    it('ERROR: {probe raises EINVAL, neither ESRCH nor EPERM} => rethrows it', () => {
      const proxy = processIsAliveBrokerProxy();
      const pid = 812326;
      proxy.setupUnrecognisedFailure({ pid });

      expect(() => processIsAliveBroker({ pid })).toThrow(/^kill EINVAL$/u);
    });
  });
});
