import { HealthStatusPayloadStub } from '@dungeonmaster/shared/contracts';

import { healthStatusGetBroker } from './health-status-get-broker';
import { healthStatusGetBrokerProxy } from './health-status-get-broker.proxy';

describe('healthStatusGetBroker', () => {
  it('VALID: {single call} => issues exactly one GET against the health-status endpoint', async () => {
    const proxy = healthStatusGetBrokerProxy();
    proxy.setupSeed({
      payload: HealthStatusPayloadStub({ status: 'ok', uptimeSeconds: 11520, version: '1.4.0' }),
    });

    await healthStatusGetBroker();

    expect(proxy.getRequestCount()).toBe(1);
  });

  it('VALID: {200 body status ok, uptimeSeconds 11520} => returns online branch with that uptime and no lastHeartbeatAt', async () => {
    const proxy = healthStatusGetBrokerProxy();
    proxy.setupSeed({
      payload: HealthStatusPayloadStub({ status: 'ok', uptimeSeconds: 11520, version: '1.4.0' }),
    });

    const result = await healthStatusGetBroker();

    expect(result).toStrictEqual({ state: 'online', uptimeSeconds: 11520 });
  });

  it('VALID: {200 body status degraded} => returns degraded branch with no uptimeSeconds key', async () => {
    const proxy = healthStatusGetBrokerProxy();
    proxy.setupSeed({
      payload: HealthStatusPayloadStub({
        status: 'degraded',
        uptimeSeconds: 11520,
        version: '1.4.0',
      }),
    });

    const result = await healthStatusGetBroker();

    expect(result).toStrictEqual({ state: 'degraded' });
  });

  it('ERROR: {500 response} => returns offline branch with offlineCause server-error and offlineStatusCode 500 rather than throwing', async () => {
    const proxy = healthStatusGetBrokerProxy();
    proxy.setupServerError();

    const result = await healthStatusGetBroker();

    expect(result).toStrictEqual({
      state: 'offline',
      offlineCause: 'server-error',
      offlineStatusCode: 500,
    });
  });

  it('ERROR: {network failure} => returns offline branch with offlineCause unreachable rather than throwing', async () => {
    const proxy = healthStatusGetBrokerProxy();
    proxy.setupUnreachable();

    const result = await healthStatusGetBroker();

    expect(result).toStrictEqual({ state: 'offline', offlineCause: 'unreachable' });
  });

  it('INVALID: {200 body missing uptimeSeconds} => returns offline branch with offlineCause server-error rather than throwing', async () => {
    const proxy = healthStatusGetBrokerProxy();
    proxy.setupInvalidBody({ body: { status: 'ok', version: '1.4.0' } });

    const result = await healthStatusGetBroker();

    expect(result).toStrictEqual({ state: 'offline', offlineCause: 'server-error' });
  });
});
