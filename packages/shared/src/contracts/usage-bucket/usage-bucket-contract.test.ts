import { usageBucketContract } from './usage-bucket-contract';
import { UsageBucketStub } from './usage-bucket.stub';

describe('usageBucketContract', () => {
  describe('valid input', () => {
    it('VALID: {all four counts} => parses to the complete bucket', () => {
      const bucket = usageBucketContract.parse({
        input: 120,
        cacheCreation: 4_000,
        cacheRead: 90_000,
        output: 300,
      });

      expect(bucket).toStrictEqual({
        input: 120,
        cacheCreation: 4_000,
        cacheRead: 90_000,
        output: 300,
      });
    });

    it('EMPTY: {all zero} => parses, which is an hour nothing ran in', () => {
      const bucket = UsageBucketStub({
        input: 0,
        cacheCreation: 0,
        cacheRead: 0,
        output: 0,
      });

      expect(bucket).toStrictEqual({ input: 0, cacheCreation: 0, cacheRead: 0, output: 0 });
    });

    it('EDGE: {a billion cache reads} => parses, because real weeks reach that scale', () => {
      expect(UsageBucketStub({ cacheRead: 16_062_023_589 }).cacheRead).toBe(16_062_023_589);
    });
  });

  describe('invalid input', () => {
    it('INVALID: {input: -1} => throws, because spend never goes backwards', () => {
      expect(() => UsageBucketStub({ input: -1 as never })).toThrow(/greater than or equal to 0/u);
    });

    it('INVALID: {output: 1.5} => throws on a fractional token count', () => {
      expect(() => UsageBucketStub({ output: 1.5 as never })).toThrow(/integer/u);
    });

    it('INVALID: {cacheRead missing} => throws', () => {
      expect(() => usageBucketContract.parse({ input: 1, cacheCreation: 1, output: 1 })).toThrow(
        /Required/u,
      );
    });
  });
});
