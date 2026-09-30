import { ReadingCountStub } from '../reading-count/reading-count.stub';
import { rawSettleProbeContract } from './raw-settle-probe-contract';
import { RawSettleProbeStub } from './raw-settle-probe.stub';

describe('rawSettleProbeContract', () => {
  it('VALID: {defaults} => parses a probe of a page nothing has touched', () => {
    expect(RawSettleProbeStub()).toStrictEqual({
      nowMs: 1_700_000_000_000,
      lastMutationAtMs: null,
      runningAnimations: 0,
    });
  });

  it('VALID: {a mutation and two animations} => parses every field', () => {
    expect(
      RawSettleProbeStub({
        lastMutationAtMs: 1_699_999_999_900,
        runningAnimations: ReadingCountStub({ value: 2 }),
      }),
    ).toStrictEqual({
      nowMs: 1_700_000_000_000,
      lastMutationAtMs: 1_699_999_999_900,
      runningAnimations: 2,
    });
  });

  it('INVALID: {runningAnimations: -1} => throws for a negative animation count', () => {
    expect(() =>
      rawSettleProbeContract.parse({ nowMs: 1, lastMutationAtMs: null, runningAnimations: -1 }),
    ).toThrow(/expected number to be >=0/u);
  });

  it('INVALID: {lastMutationAtMs missing} => throws, because an absent clock is not a quiet one', () => {
    expect(() => rawSettleProbeContract.parse({ nowMs: 1, runningAnimations: 0 })).toThrow(
      /lastMutationAtMs/u,
    );
  });
});
