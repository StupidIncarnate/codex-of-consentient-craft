import { isHeartbeatSilentGuard } from './is-heartbeat-silent-guard';

describe('isHeartbeatSilentGuard', () => {
  describe('before the threshold', () => {
    it('EDGE: {elapsed: 29000ms} => returns false', () => {
      const lastHeartbeatAt = '2026-07-01T12:00:00.000Z' as never;
      const now = new Date('2026-07-01T12:00:00.000Z').getTime() + 29000;

      const result = isHeartbeatSilentGuard({ lastHeartbeatAt, now });

      expect(result).toBe(false);
    });
  });

  describe('at the threshold', () => {
    it('EDGE: {elapsed: 30000ms} => returns true', () => {
      const lastHeartbeatAt = '2026-07-01T12:00:00.000Z' as never;
      const now = new Date('2026-07-01T12:00:00.000Z').getTime() + 30000;

      const result = isHeartbeatSilentGuard({ lastHeartbeatAt, now });

      expect(result).toBe(true);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {lastHeartbeatAt: undefined} => returns false', () => {
      const now = Date.now();

      const result = isHeartbeatSilentGuard({ now });

      expect(result).toBe(false);
    });

    it('EMPTY: {now: undefined} => returns false', () => {
      const lastHeartbeatAt = '2026-07-01T12:00:00.000Z' as never;

      const result = isHeartbeatSilentGuard({ lastHeartbeatAt });

      expect(result).toBe(false);
    });
  });
});
