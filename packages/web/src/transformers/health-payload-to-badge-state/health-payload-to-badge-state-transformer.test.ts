import { HealthStatusPayloadStub } from '@dungeonmaster/shared/contracts';

import { healthPayloadToBadgeStateTransformer } from './health-payload-to-badge-state-transformer';

const ISO_TIMESTAMP = '2026-07-01T12:00:00.000Z' as never;

describe('healthPayloadToBadgeStateTransformer', () => {
  describe('status ok', () => {
    it('VALID: {status: ok, lastHeartbeatAt: null} => returns online branch with uptimeSeconds and no lastHeartbeatAt key', () => {
      const payload = HealthStatusPayloadStub({ status: 'ok', uptimeSeconds: 11520 });

      const result = healthPayloadToBadgeStateTransformer({ payload, lastHeartbeatAt: null });

      expect(result).toStrictEqual({ state: 'online', uptimeSeconds: 11520 });
    });

    it('VALID: {status: ok, lastHeartbeatAt: given} => returns online branch carrying exactly that timestamp', () => {
      const payload = HealthStatusPayloadStub({ status: 'ok', uptimeSeconds: 11520 });

      const result = healthPayloadToBadgeStateTransformer({
        payload,
        lastHeartbeatAt: ISO_TIMESTAMP,
      });

      expect(result).toStrictEqual({
        state: 'online',
        uptimeSeconds: 11520,
        lastHeartbeatAt: ISO_TIMESTAMP,
      });
    });
  });

  describe('status degraded', () => {
    it('VALID: {status: degraded, lastHeartbeatAt: null} => returns degraded branch with no uptimeSeconds or lastHeartbeatAt key', () => {
      const payload = HealthStatusPayloadStub({ status: 'degraded' });

      const result = healthPayloadToBadgeStateTransformer({ payload, lastHeartbeatAt: null });

      expect(result).toStrictEqual({ state: 'degraded' });
    });

    it('VALID: {status: degraded, lastHeartbeatAt: given} => returns degraded branch carrying exactly that timestamp', () => {
      const payload = HealthStatusPayloadStub({ status: 'degraded' });

      const result = healthPayloadToBadgeStateTransformer({
        payload,
        lastHeartbeatAt: ISO_TIMESTAMP,
      });

      expect(result).toStrictEqual({ state: 'degraded', lastHeartbeatAt: ISO_TIMESTAMP });
    });
  });
});
