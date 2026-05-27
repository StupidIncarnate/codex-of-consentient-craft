import { smoketestInProcessDriverStatics } from './smoketest-in-process-driver-statics';

describe('smoketestInProcessDriverStatics', () => {
  it('VALID: {smoketestInProcessDriverStatics} => exposes expected tunables', () => {
    expect(smoketestInProcessDriverStatics).toStrictEqual({
      defaultMaxDispatches: 100,
      shortPollTotalMs: 50,
      shortPollIntervalMs: 25,
    });
  });
});
