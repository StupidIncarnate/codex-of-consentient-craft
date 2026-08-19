import { HealthSnapshotStub } from '@dungeonmaster/shared/contracts';

import { HealthCheckResponderProxy } from './health-check-responder.proxy';

describe('HealthCheckResponder', () => {
  it('VALID: {broker returns a snapshot} => returns 200 with the 7-key body', async () => {
    const proxy = HealthCheckResponderProxy();
    const snapshot = HealthSnapshotStub();
    proxy.setupSnapshot({ snapshot });

    const result = await proxy.callResponder();

    expect(result).toStrictEqual({
      status: 200,
      data: {
        status: 'ok',
        timestamp: '2026-05-05T13:00:00.000Z',
        uptimeSeconds: 745,
        version: '0.1.0',
        port: 3737,
        home: '/home/user/.dungeonmaster',
        orchestrationMode: 'claude',
      },
    });
  });

  it('ERROR: {broker throws} => returns 500 with the error message', async () => {
    const proxy = HealthCheckResponderProxy();
    proxy.setupFailure({ message: 'read failed' });

    const result = await proxy.callResponder();

    expect(result).toStrictEqual({
      status: 500,
      data: { error: 'read failed' },
    });
  });

  it('ERROR: {broker throws a non-Error value} => returns 500 with the fallback message', async () => {
    const proxy = HealthCheckResponderProxy();
    proxy.setupNonErrorFailure();

    const result = await proxy.callResponder();

    expect(result).toStrictEqual({
      status: 500,
      data: { error: 'Failed to assemble health snapshot' },
    });
  });
});
