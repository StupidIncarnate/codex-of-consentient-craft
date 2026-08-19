import { HealthSnapshotStub } from '@dungeonmaster/shared/contracts';

import { healthGetBroker } from './health-get-broker';
import { healthGetBrokerProxy } from './health-get-broker.proxy';

describe('healthGetBroker', () => {
  it('VALID: {server returns 200 snapshot} => returns parsed snapshot', async () => {
    const proxy = healthGetBrokerProxy();
    const snapshot = HealthSnapshotStub();
    proxy.setupSnapshot({ snapshot });

    const result = await healthGetBroker();

    expect(result).toStrictEqual(snapshot);
  });

  it('ERROR: {500 response} => rejects', async () => {
    const proxy = healthGetBrokerProxy();
    proxy.setupServerError();

    await expect(healthGetBroker()).rejects.toThrow(/.+/u);
  });

  it('ERROR: {network error} => rejects', async () => {
    const proxy = healthGetBrokerProxy();
    proxy.setupNetworkError();

    await expect(healthGetBroker()).rejects.toThrow(/.+/u);
  });

  it('INVALID: {200 body missing uptimeSeconds} => rejects with a uptimeSeconds contract complaint', async () => {
    const proxy = healthGetBrokerProxy();
    proxy.setupInvalidBody();

    await expect(healthGetBroker()).rejects.toThrow(/uptimeSeconds/u);
  });
});
