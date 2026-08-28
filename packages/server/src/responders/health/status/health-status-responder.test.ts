import { HealthStatusPayloadStub } from '@dungeonmaster/shared/contracts';

import { HealthStatusResponderProxy } from './health-status-responder.proxy';

describe('HealthStatusResponder', () => {
  it('VALID: {uptime: 42.9, version: "0.1.0"} => returns 200 with the payload as the whole body', () => {
    const proxy = HealthStatusResponderProxy();
    proxy.setupHealth({ uptime: 42.9, version: '0.1.0' });

    const result = proxy.callResponder();

    expect(result).toStrictEqual({
      status: 200,
      data: HealthStatusPayloadStub({ uptimeSeconds: 42, version: '0.1.0' }),
    });
  });

  it('VALID: {} => returns the result synchronously, not a Promise', () => {
    const proxy = HealthStatusResponderProxy();
    proxy.setupHealth({ uptime: 5, version: '0.1.0' });

    const result = proxy.callResponder();

    expect(result instanceof Promise).toBe(false);
  });

  it('ERROR: {version read throws} => returns 500 with an error message and does not propagate', () => {
    const proxy = HealthStatusResponderProxy();
    proxy.setupError({ message: 'kaboom' });

    const result = proxy.callResponder();

    expect(result).toStrictEqual({
      status: 500,
      data: {
        error:
          'serverPackageVersionAdapter: failed to read version from @dungeonmaster/server/package.json: Error: kaboom',
      },
    });
  });
});
