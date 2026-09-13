import { usageSampleContract } from './usage-sample-contract';
import { UsageSampleStub } from './usage-sample.stub';

describe('usageSampleContract', () => {
  describe('valid input', () => {
    it('VALID: {bucketStartMs, tokens} => parses to the complete sample', () => {
      expect(UsageSampleStub()).toStrictEqual({
        bucketStartMs: 1_789_272_000_000,
        tokens: { input: 120, cacheCreation: 4_000, cacheRead: 90_000, output: 300 },
      });
    });

    it('EDGE: {bucketStartMs: 0} => parses, because the epoch is a legal bucket start', () => {
      expect(UsageSampleStub({ bucketStartMs: 0 }).bucketStartMs).toBe(0);
    });
  });

  describe('invalid input', () => {
    it('INVALID: {bucketStartMs: -1} => throws', () => {
      expect(() => UsageSampleStub({ bucketStartMs: -1 as never })).toThrow(
        /greater than or equal to 0/u,
      );
    });

    it('INVALID: {tokens missing} => throws', () => {
      expect(() => usageSampleContract.parse({ bucketStartMs: 0 })).toThrow(/Required/u);
    });
  });
});
