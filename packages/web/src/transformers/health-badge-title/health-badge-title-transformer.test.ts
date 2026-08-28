import { HealthBadgeStateStub } from '../../contracts/health-badge-state/health-badge-state.stub';

import { healthBadgeTitleTransformer } from './health-badge-title-transformer';

describe('healthBadgeTitleTransformer', () => {
  describe('offline branch', () => {
    it('VALID: {offlineCause: unreachable} => returns "No response from server"', () => {
      const badgeState = HealthBadgeStateStub({ state: 'offline', offlineCause: 'unreachable' });

      const result = healthBadgeTitleTransformer({ badgeState });

      expect(result).toBe('No response from server');
    });

    it('VALID: {offlineCause: server-error, offlineStatusCode: 500} => returns "Server returned 500"', () => {
      const badgeState = HealthBadgeStateStub({
        state: 'offline',
        offlineCause: 'server-error',
        offlineStatusCode: 500,
      });

      const result = healthBadgeTitleTransformer({ badgeState });

      expect(result).toBe('Server returned 500');
    });

    it('VALID: {offlineCause: server-error, offlineStatusCode: 503} => returns "Server returned 503"', () => {
      const badgeState = HealthBadgeStateStub({
        state: 'offline',
        offlineCause: 'server-error',
        offlineStatusCode: 503,
      });

      const result = healthBadgeTitleTransformer({ badgeState });

      expect(result).toBe('Server returned 503');
    });

    it('EDGE: {offlineCause: server-error, no offlineStatusCode} => returns "Server returned" prefix alone', () => {
      const badgeState = HealthBadgeStateStub({ state: 'offline', offlineCause: 'server-error' });

      const result = healthBadgeTitleTransformer({ badgeState });

      expect(result).toBe('Server returned');
    });

    it('VALID: {offlineCause: silence} => returns "No heartbeat for 30 seconds"', () => {
      const badgeState = HealthBadgeStateStub({ state: 'offline', offlineCause: 'silence' });

      const result = healthBadgeTitleTransformer({ badgeState });

      expect(result).toBe('No heartbeat for 30 seconds');
    });
  });

  describe('non-offline branches', () => {
    it('VALID: {state: checking} => returns "CHECKING"', () => {
      const badgeState = HealthBadgeStateStub({ state: 'checking' });

      const result = healthBadgeTitleTransformer({ badgeState });

      expect(result).toBe('CHECKING');
    });

    it('VALID: {state: online} => returns "ONLINE"', () => {
      const badgeState = HealthBadgeStateStub({ state: 'online', uptimeSeconds: 11520 });

      const result = healthBadgeTitleTransformer({ badgeState });

      expect(result).toBe('ONLINE');
    });

    it('VALID: {state: degraded} => returns "DEGRADED"', () => {
      const badgeState = HealthBadgeStateStub({ state: 'degraded' });

      const result = healthBadgeTitleTransformer({ badgeState });

      expect(result).toBe('DEGRADED');
    });
  });
});
