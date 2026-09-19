import { driverStatics } from './driver-statics';

describe('driverStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(driverStatics).toStrictEqual({
      socket: {
        connectTimeoutMs: 5_000,
        requestTimeoutMs: 300_000,
        maxRequestBytes: 500_000,
      },
      idle: {
        timeoutMs: 900_000,
      },
      boot: {
        readyPollMs: 250,
        defaultTimeoutMs: 180_000,
        readyProbeTimeoutMs: 5_000,
        homePrefix: 'dm-siege-',
      },
      teardown: {
        graceMs: 3_000,
        signals: ['SIGINT', 'SIGTERM'],
      },
      run: {
        defaultStepTimeoutMs: 30_000,
        untilPollMs: 100,
      },
    });
  });
});
