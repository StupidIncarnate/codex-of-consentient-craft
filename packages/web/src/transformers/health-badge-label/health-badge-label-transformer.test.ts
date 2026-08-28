import { HealthBadgeStateStub } from '../../contracts/health-badge-state/health-badge-state.stub';

import { healthBadgeLabelTransformer } from './health-badge-label-transformer';

describe('healthBadgeLabelTransformer', () => {
  describe('online branch', () => {
    it('VALID: {state: online, uptimeSeconds: 11520} => returns "ONLINE 3h 12m"', () => {
      const badgeState = HealthBadgeStateStub({ state: 'online', uptimeSeconds: 11520 });

      const result = healthBadgeLabelTransformer({ badgeState });

      expect(result).toBe('ONLINE 3h 12m');
    });
  });

  describe('degraded branch', () => {
    it('VALID: {state: degraded} => returns "DEGRADED" with nothing appended', () => {
      const badgeState = HealthBadgeStateStub({ state: 'degraded' });

      const result = healthBadgeLabelTransformer({ badgeState });

      expect(result).toBe('DEGRADED');
    });
  });

  describe('offline branch', () => {
    it('VALID: {state: offline, offlineCause: unreachable} => returns "OFFLINE"', () => {
      const badgeState = HealthBadgeStateStub({ state: 'offline', offlineCause: 'unreachable' });

      const result = healthBadgeLabelTransformer({ badgeState });

      expect(result).toBe('OFFLINE');
    });

    it('VALID: {state: offline, offlineCause: server-error} => returns "OFFLINE"', () => {
      const badgeState = HealthBadgeStateStub({
        state: 'offline',
        offlineCause: 'server-error',
        offlineStatusCode: 500,
      });

      const result = healthBadgeLabelTransformer({ badgeState });

      expect(result).toBe('OFFLINE');
    });

    it('VALID: {state: offline, offlineCause: silence} => returns "OFFLINE"', () => {
      const badgeState = HealthBadgeStateStub({ state: 'offline', offlineCause: 'silence' });

      const result = healthBadgeLabelTransformer({ badgeState });

      expect(result).toBe('OFFLINE');
    });
  });

  describe('checking branch', () => {
    it('EMPTY: {state: checking} => returns "CHECKING"', () => {
      const badgeState = HealthBadgeStateStub({ state: 'checking' });

      const result = healthBadgeLabelTransformer({ badgeState });

      expect(result).toBe('CHECKING');
    });
  });
});
