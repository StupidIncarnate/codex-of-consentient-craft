import { instanceLifecycleStatics } from './instance-lifecycle-statics';

describe('instanceLifecycleStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(instanceLifecycleStatics).toStrictEqual({
      ids: {
        instancePrefix: 'inst_',
        runPrefix: 'run_',
        entropyBytes: 4,
      },
      numbering: {
        firstStep: 1,
      },
      heartbeat: {
        intervalMs: 5000,
        stalenessBeats: 3,
      },
      bootLock: {
        ttlMs: 45_000,
        waitCeilingMs: 120_000,
        pollMs: 1000,
      },
      reservation: {
        staleAfterMs: 300_000,
      },
      ports: {
        claimAttempts: 5,
      },
      registryLock: {
        ttlMs: 2_000,
        waitCeilingMs: 5_000,
        pollMs: 25,
      },
    });
  });
});
