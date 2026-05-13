import { processStaleThresholdStatics } from './process-stale-threshold-statics';

describe('processStaleThresholdStatics', () => {
  it('VALID: {default values} => match exported shape', () => {
    expect(processStaleThresholdStatics).toStrictEqual({
      thresholdMs: 60_000,
      tickIntervalMs: 30_000,
    });
  });
});
