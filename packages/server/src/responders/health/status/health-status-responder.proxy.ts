import { healthStatusSnapshotBrokerProxy } from '../../../brokers/health-status/snapshot/health-status-snapshot-broker.proxy';
import { HealthStatusResponder } from './health-status-responder';

export const HealthStatusResponderProxy = (): {
  setupSnapshot: (params: { uptimeSeconds: number; version: string }) => void;
  setupBrokerThrows: () => void;
  callResponder: typeof HealthStatusResponder;
} => {
  const brokerProxy = healthStatusSnapshotBrokerProxy();

  return {
    setupSnapshot: brokerProxy.setupSnapshot,
    // The broker's own proxy exposes no throw path (its INTENT never needs one), but its
    // `setupSnapshot` stages `process.uptime` through the raw, unbranded `uptimeSeconds: number`
    // — a negative value survives that staging and reaches the broker's real
    // `healthStatusPayloadContract.shape.uptimeSeconds.parse(...)` call inside
    // processUptimeAdapter, where `.nonnegative()` rejects it for real. This drives the broker's
    // genuine throw path rather than inventing a mock the broker would never actually take.
    setupBrokerThrows: (): void => {
      brokerProxy.setupSnapshot({ uptimeSeconds: -1, version: '1.0.0' });
    },
    callResponder: HealthStatusResponder,
  };
};
