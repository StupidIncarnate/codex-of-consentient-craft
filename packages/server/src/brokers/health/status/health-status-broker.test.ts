import { HealthStatusPayloadStub } from '@dungeonmaster/shared/contracts';

import { healthStatusBroker } from './health-status-broker';
import { healthStatusBrokerProxy } from './health-status-broker.proxy';

describe('healthStatusBroker', () => {
  it('VALID: {uptime: 42.9, version: "0.1.0"} => returns {status: "ok", uptimeSeconds: 42, version: "0.1.0"}', () => {
    const proxy = healthStatusBrokerProxy();
    proxy.stagesHealth({ uptime: 42.9, version: '0.1.0' });

    const result = healthStatusBroker();

    expect(result).toStrictEqual(HealthStatusPayloadStub({ uptimeSeconds: 42, version: '0.1.0' }));
  });

  it('VALID: {uptime 100 then 110 staged in turn} => each call returns its own uptimeSeconds, nothing cached', () => {
    const proxy = healthStatusBrokerProxy();

    proxy.stagesHealth({ uptime: 100, version: '0.1.0' });
    const first = healthStatusBroker();

    proxy.stagesHealth({ uptime: 110, version: '0.1.0' });
    const second = healthStatusBroker();

    expect(first).toStrictEqual(HealthStatusPayloadStub({ uptimeSeconds: 100, version: '0.1.0' }));
    expect(second).toStrictEqual(HealthStatusPayloadStub({ uptimeSeconds: 110, version: '0.1.0' }));
  });

  it('VALID: {} => returns the payload synchronously, not a Promise', () => {
    const proxy = healthStatusBrokerProxy();
    proxy.stagesHealth({ uptime: 5, version: '0.1.0' });

    const result = healthStatusBroker();

    expect(result instanceof Promise).toBe(false);
  });
});
