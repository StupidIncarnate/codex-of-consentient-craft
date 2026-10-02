import { e2eShardOutputContract } from './e2e-shard-output-contract';
import { E2eShardOutputStub } from './e2e-shard-output.stub';

describe('e2eShardOutputContract', () => {
  describe('valid inputs', () => {
    it('VALID: full shard output => parses successfully', () => {
      const result = e2eShardOutputContract.parse(
        E2eShardOutputStub({
          shardIndex: 1,
          shardCount: 3,
          output: 'Running 10 tests across 3 shards',
          exitCode: 0,
          signal: null,
          passingTests: [],
          openHandles: [],
        }),
      );

      expect(result).toStrictEqual({
        shardIndex: 1,
        shardCount: 3,
        output: 'Running 10 tests across 3 shards',
        exitCode: 0,
        signal: null,
        passingTests: [],
        openHandles: [],
      });
    });

    it('VALID: {exitCode: 1 with output} => parses error output', () => {
      const result = e2eShardOutputContract.parse(
        E2eShardOutputStub({
          shardIndex: 2,
          shardCount: 3,
          output: 'Error: test failed',
          exitCode: 1,
        }),
      );

      expect(result).toStrictEqual({
        shardIndex: 2,
        shardCount: 3,
        output: 'Error: test failed',
        exitCode: 1,
        signal: null,
        passingTests: [],
        openHandles: [],
      });
    });

    it('VALID: {without shardIndex and shardCount} => parses merged output successfully', () => {
      const result = e2eShardOutputContract.parse({
        output: 'merged output',
        exitCode: 0,
        signal: null,
        passingTests: [],
        openHandles: [],
      });

      expect(result).toStrictEqual({
        output: 'merged output',
        exitCode: 0,
        signal: null,
        passingTests: [],
        openHandles: [],
      });
    });
  });

  describe('signal', () => {
    it("VALID: {signal: 'SIGKILL'} => parses to itself", () => {
      const result = e2eShardOutputContract.parse(
        E2eShardOutputStub({
          exitCode: 137,
          signal: 'SIGKILL',
        }),
      );

      expect(result.signal).toBe('SIGKILL');
    });

    it('VALID: {signal: null} => stays null', () => {
      const result = e2eShardOutputContract.parse(
        E2eShardOutputStub({
          signal: null,
        }),
      );

      expect(result.signal).toBe(null);
    });

    it('VALID: {signal absent} => defaults to null', () => {
      const result = e2eShardOutputContract.parse({
        output: '',
        exitCode: 0,
      });

      expect(result.signal).toBe(null);
    });

    it('INVALID: {signal: ""} => throws validation error', () => {
      expect(() =>
        e2eShardOutputContract.parse({
          output: '',
          exitCode: 1,
          signal: '',
        }),
      ).toThrow(/Invalid input/u);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {exitCode: "zero"} => throws validation error', () => {
      expect(() =>
        e2eShardOutputContract.parse({
          output: '',
          exitCode: 'zero',
        }),
      ).toThrow(/expected number/u);
    });

    it('INVALID: {shardCount: 0} => throws validation error', () => {
      expect(() =>
        e2eShardOutputContract.parse({
          shardCount: 0,
          output: '',
          exitCode: 0,
        }),
      ).toThrow(/too_small/u);
    });

    it('INVALID: {missing required fields} => throws validation error', () => {
      expect(() => e2eShardOutputContract.parse({})).toThrow(/received undefined/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid e2e shard output', () => {
      const result = E2eShardOutputStub();

      expect(result).toStrictEqual({
        shardIndex: 1,
        shardCount: 1,
        output: '',
        exitCode: 0,
        signal: null,
        passingTests: [],
        openHandles: [],
      });
    });

    it('VALID: {custom values} => creates shard output with overrides', () => {
      const result = E2eShardOutputStub({
        shardIndex: 2,
        shardCount: 5,
        output: 'overridden',
        exitCode: 2,
      });

      expect(result).toStrictEqual({
        shardIndex: 2,
        shardCount: 5,
        output: 'overridden',
        exitCode: 2,
        signal: null,
        passingTests: [],
        openHandles: [],
      });
    });
  });
});
