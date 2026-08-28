import { healthBadgeStateContract } from './health-badge-state-contract';
import { HealthBadgeStateStub } from './health-badge-state.stub';

describe('healthBadgeStateContract', () => {
  describe('valid states', () => {
    it('VALID: {state: checking} => parses successfully', () => {
      const result = HealthBadgeStateStub();

      expect(result).toStrictEqual({ state: 'checking' });
    });

    it('VALID: {state: online, uptimeSeconds: 11520} => parses successfully', () => {
      const result = HealthBadgeStateStub({ state: 'online', uptimeSeconds: 11520 });

      expect(result).toStrictEqual({ state: 'online', uptimeSeconds: 11520 });
    });

    it('VALID: {state: online, uptimeSeconds, lastHeartbeatAt} => parses with lastHeartbeatAt', () => {
      const result = HealthBadgeStateStub({
        state: 'online',
        uptimeSeconds: 11520,
        lastHeartbeatAt: '2026-07-01T12:00:00.000Z',
      });

      expect(result).toStrictEqual({
        state: 'online',
        uptimeSeconds: 11520,
        lastHeartbeatAt: '2026-07-01T12:00:00.000Z',
      });
    });

    it('VALID: {state: degraded} => parses successfully', () => {
      const result = HealthBadgeStateStub({ state: 'degraded' });

      expect(result).toStrictEqual({ state: 'degraded' });
    });

    it('VALID: {state: offline, offlineCause: unreachable} => parses successfully', () => {
      const result = HealthBadgeStateStub({ state: 'offline', offlineCause: 'unreachable' });

      expect(result).toStrictEqual({ state: 'offline', offlineCause: 'unreachable' });
    });

    it('VALID: {state: offline, offlineCause: server-error, offlineStatusCode: 500} => parses with offlineStatusCode', () => {
      const result = HealthBadgeStateStub({
        state: 'offline',
        offlineCause: 'server-error',
        offlineStatusCode: 500,
      });

      expect(result).toStrictEqual({
        state: 'offline',
        offlineCause: 'server-error',
        offlineStatusCode: 500,
      });
    });

    it('VALID: {state: offline, offlineCause: silence} => parses successfully', () => {
      const result = HealthBadgeStateStub({ state: 'offline', offlineCause: 'silence' });

      expect(result).toStrictEqual({ state: 'offline', offlineCause: 'silence' });
    });
  });

  describe('branch stripping', () => {
    it('VALID: {state: degraded, uptimeSeconds: 1} => parses with no uptimeSeconds key', () => {
      const result = healthBadgeStateContract.parse({ state: 'degraded', uptimeSeconds: 1 });

      expect(result).toStrictEqual({ state: 'degraded' });
    });

    it('VALID: {state: checking, offlineCause: silence} => parses with no offlineCause key', () => {
      const result = healthBadgeStateContract.parse({ state: 'checking', offlineCause: 'silence' });

      expect(result).toStrictEqual({ state: 'checking' });
    });
  });

  describe('invalid states', () => {
    it('INVALID: {state: unknown} => throws discriminator validation error', () => {
      expect(() => healthBadgeStateContract.parse({ state: 'unknown' })).toThrow(
        /Invalid discriminator/u,
      );
    });

    it('INVALID: {state: online, missing uptimeSeconds} => throws validation error', () => {
      expect(() => healthBadgeStateContract.parse({ state: 'online' })).toThrow(/Required/u);
    });

    it('INVALID: {state: online, uptimeSeconds: -1} => throws below-zero validation error', () => {
      expect(() => healthBadgeStateContract.parse({ state: 'online', uptimeSeconds: -1 })).toThrow(
        /too_small/u,
      );
    });

    it('INVALID: {state: online, lastHeartbeatAt: not-a-timestamp} => throws datetime validation error', () => {
      expect(() =>
        healthBadgeStateContract.parse({
          state: 'online',
          uptimeSeconds: 11520,
          lastHeartbeatAt: 'not-a-timestamp',
        }),
      ).toThrow(/Invalid datetime/u);
    });

    it('INVALID: {state: offline, missing offlineCause} => throws validation error', () => {
      expect(() => healthBadgeStateContract.parse({ state: 'offline' })).toThrow(/Required/u);
    });

    it('INVALID: {state: offline, offlineCause: made-up} => throws validation error', () => {
      expect(() =>
        healthBadgeStateContract.parse({ state: 'offline', offlineCause: 'made-up' as never }),
      ).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {state: offline, offlineStatusCode: 99} => throws below-range validation error', () => {
      expect(() =>
        healthBadgeStateContract.parse({
          state: 'offline',
          offlineCause: 'server-error',
          offlineStatusCode: 99,
        }),
      ).toThrow(/too_small/u);
    });

    it('INVALID: {state: offline, offlineStatusCode: 600} => throws above-range validation error', () => {
      expect(() =>
        healthBadgeStateContract.parse({
          state: 'offline',
          offlineCause: 'server-error',
          offlineStatusCode: 600,
        }),
      ).toThrow(/too_big/u);
    });
  });
});
