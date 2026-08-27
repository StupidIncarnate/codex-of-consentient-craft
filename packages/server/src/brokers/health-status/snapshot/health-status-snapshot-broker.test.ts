import { HealthStatusPayloadStub } from '@dungeonmaster/shared/contracts';

import { healthStatusSnapshotBroker } from './health-status-snapshot-broker';
import { healthStatusSnapshotBrokerProxy } from './health-status-snapshot-broker.proxy';

describe('healthStatusSnapshotBroker', () => {
  it('VALID: {uptimeSeconds: 120, version: "1.0.0"} => returns exactly {status: "ok", uptimeSeconds: 120, version: "1.0.0"}', () => {
    const proxy = healthStatusSnapshotBrokerProxy();
    proxy.setupSnapshot({ uptimeSeconds: 120, version: '1.0.0' });

    const result = healthStatusSnapshotBroker();

    expect(result).toStrictEqual(
      HealthStatusPayloadStub({ status: 'ok', uptimeSeconds: 120, version: '1.0.0' }),
    );
  });

  it('VALID: {two calls over a rising uptime reading} => each payload reflects its own reading, not a cached first value', () => {
    const proxy = healthStatusSnapshotBrokerProxy();

    proxy.setupSnapshot({ uptimeSeconds: 100, version: '1.0.0' });
    const first = healthStatusSnapshotBroker();

    proxy.setupSnapshot({ uptimeSeconds: 200, version: '1.0.0' });
    const second = healthStatusSnapshotBroker();

    expect(first).toStrictEqual(
      HealthStatusPayloadStub({ status: 'ok', uptimeSeconds: 100, version: '1.0.0' }),
    );
    expect(second).toStrictEqual(
      HealthStatusPayloadStub({ status: 'ok', uptimeSeconds: 200, version: '1.0.0' }),
    );
  });
});
