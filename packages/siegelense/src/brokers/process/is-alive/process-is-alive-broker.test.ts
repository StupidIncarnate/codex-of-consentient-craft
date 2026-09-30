import { processIsAliveBroker } from './process-is-alive-broker';
import { processIsAliveBrokerProxy } from './process-is-alive-broker.proxy';

describe('processIsAliveBroker', () => {
  describe('a live group', () => {
    it('VALID: {alive group} => returns true', () => {
      const proxy = processIsAliveBrokerProxy();
      const pgid = 4821;
      proxy.setupAlive({ pgid });

      const result = processIsAliveBroker({ pgid });

      expect(result).toBe(true);
    });

    it('VALID: {pgid: 4821} => probes the NEGATED pgid with signal 0, not a real signal', () => {
      const proxy = processIsAliveBrokerProxy();
      const pgid = 4821;
      proxy.setupAlive({ pgid });

      processIsAliveBroker({ pgid });

      expect(proxy.getCallFor({ pgid })).toStrictEqual([-4821, 0]);
    });
  });

  describe('a group that already exited', () => {
    it('ERROR: {ESRCH} => isAlive returns false', () => {
      const proxy = processIsAliveBrokerProxy();
      const pgid = 99_999;
      proxy.setupGone({ pgid });

      const result = processIsAliveBroker({ pgid });

      expect(result).toBe(false);
    });
  });

  describe('a real failure', () => {
    it('ERROR: {EPERM} => rethrows rather than reporting false', () => {
      const proxy = processIsAliveBrokerProxy();
      const pgid = 4821;
      proxy.setupPermissionDenied({ pgid });

      expect(() => processIsAliveBroker({ pgid })).toThrow(/^kill EPERM$/u);
    });
  });
});
