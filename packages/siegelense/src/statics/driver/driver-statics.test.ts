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
      },
      teardown: {
        graceMs: 3_000,
      },
      run: {
        defaultStepTimeoutMs: 30_000,
      },
    });
  });
});
