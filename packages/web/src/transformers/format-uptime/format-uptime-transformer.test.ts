import { HealthStatusPayloadStub } from '@dungeonmaster/shared/contracts';

import { formatUptimeTransformer } from './format-uptime-transformer';

describe('formatUptimeTransformer', () => {
  describe('valid durations', () => {
    it('VALID: {uptimeSeconds: 11520} => returns "3h 12m"', () => {
      const { uptimeSeconds } = HealthStatusPayloadStub({ uptimeSeconds: 11520 });

      const result = formatUptimeTransformer({ uptimeSeconds });

      expect(result).toBe('3h 12m');
    });

    it('VALID: {uptimeSeconds: 90061} => returns "25h 1m", never a day unit', () => {
      const { uptimeSeconds } = HealthStatusPayloadStub({ uptimeSeconds: 90061 });

      const result = formatUptimeTransformer({ uptimeSeconds });

      expect(result).toBe('25h 1m');
    });
  });

  describe('edge cases', () => {
    it('EDGE: {uptimeSeconds: 0} => returns "0h 0m"', () => {
      const { uptimeSeconds } = HealthStatusPayloadStub({ uptimeSeconds: 0 });

      const result = formatUptimeTransformer({ uptimeSeconds });

      expect(result).toBe('0h 0m');
    });

    it('EDGE: {uptimeSeconds: 61} => returns "0h 1m"', () => {
      const { uptimeSeconds } = HealthStatusPayloadStub({ uptimeSeconds: 61 });

      const result = formatUptimeTransformer({ uptimeSeconds });

      expect(result).toBe('0h 1m');
    });
  });
});
