import { E2eShardOutputStub } from '../../contracts/e2e-shard-output/e2e-shard-output.stub';
import { PassingTestStub } from '../../contracts/passing-test/passing-test.stub';
import { OpenHandleStub } from '../../contracts/open-handle/open-handle.stub';
import { e2eShardOutputsMergeTransformer } from './e2e-shard-outputs-merge-transformer';

describe('e2eShardOutputsMergeTransformer', () => {
  describe('single shard', () => {
    it('VALID: one shard => passed through unchanged with no header', () => {
      const passingTest = PassingTestStub({ testName: 'single test' });
      const openHandle = OpenHandleStub({ message: 'TCPSERVERWRAP' });
      const shard = E2eShardOutputStub({
        shardIndex: 1,
        shardCount: 1,
        output: 'single shard output\n',
        exitCode: 0,
        signal: null,
        passingTests: [passingTest],
        openHandles: [openHandle],
      });

      const result = e2eShardOutputsMergeTransformer({
        shardOutputs: [shard],
      });

      expect(result).toStrictEqual(shard);
    });
  });

  describe('three shards', () => {
    it('VALID: three shards with shard 2 failing => exitCode 1 and merged output with headers', () => {
      const passingTest1 = PassingTestStub({ testName: 'test 1' });
      const passingTest3 = PassingTestStub({ testName: 'test 3' });
      const openHandle2 = OpenHandleStub({ message: 'TCPSERVERWRAP' });

      const shard1 = E2eShardOutputStub({
        shardIndex: 1,
        shardCount: 3,
        output: 'shard 1 passed\n',
        exitCode: 0,
        signal: null,
        passingTests: [passingTest1],
        openHandles: [],
      });

      const shard2 = E2eShardOutputStub({
        shardIndex: 2,
        shardCount: 3,
        output: 'shard 2 failed\n',
        exitCode: 1,
        signal: null,
        passingTests: [],
        openHandles: [openHandle2],
      });

      const shard3 = E2eShardOutputStub({
        shardIndex: 3,
        shardCount: 3,
        output: 'shard 3 passed\n',
        exitCode: 0,
        signal: null,
        passingTests: [passingTest3],
        openHandles: [],
      });

      const result = e2eShardOutputsMergeTransformer({
        shardOutputs: [shard1, shard2, shard3],
      });

      expect(result).toStrictEqual({
        output:
          '--- e2e shard 1/3 ---\nshard 1 passed\n--- e2e shard 2/3 ---\nshard 2 failed\n--- e2e shard 3/3 ---\nshard 3 output\n'.replace(
            'shard 3 output\n',
            'shard 3 passed\n',
          ),
        exitCode: 1,
        signal: null,
        passingTests: [passingTest1, passingTest3],
        openHandles: [openHandle2],
      });
    });

    it('VALID: three shards with signal in shard 3 => merges signal', () => {
      const shard1 = E2eShardOutputStub({
        shardIndex: 1,
        shardCount: 3,
        output: 'shard 1 output\n',
        exitCode: 0,
        signal: null,
      });

      const shard2 = E2eShardOutputStub({
        shardIndex: 2,
        shardCount: 3,
        output: 'shard 2 output\n',
        exitCode: 0,
        signal: null,
      });

      const shard3 = E2eShardOutputStub({
        shardIndex: 3,
        shardCount: 3,
        output: 'shard 3 killed\n',
        exitCode: 137,
        signal: 'SIGKILL',
      });

      const result = e2eShardOutputsMergeTransformer({
        shardOutputs: [shard1, shard2, shard3],
      });

      expect(result).toStrictEqual({
        output:
          '--- e2e shard 1/3 ---\nshard 1 output\n--- e2e shard 2/3 ---\nshard 2 output\n--- e2e shard 3/3 ---\nshard 3 killed\n',
        exitCode: 137,
        signal: 'SIGKILL',
        passingTests: [],
        openHandles: [],
      });
    });
  });

  describe('edge cases', () => {
    it('EDGE: empty shards array => returns empty output', () => {
      const result = e2eShardOutputsMergeTransformer({
        shardOutputs: [],
      });

      expect(result).toStrictEqual({
        output: '',
        exitCode: 0,
        signal: null,
        passingTests: [],
        openHandles: [],
      });
    });

    it('EDGE: out-of-order shards => sorted into shard order', () => {
      const shard1 = E2eShardOutputStub({
        shardIndex: 1,
        shardCount: 3,
        output: 'out1\n',
        exitCode: 0,
      });

      const shard2 = E2eShardOutputStub({
        shardIndex: 2,
        shardCount: 3,
        output: 'out2\n',
        exitCode: 0,
      });

      const shard3 = E2eShardOutputStub({
        shardIndex: 3,
        shardCount: 3,
        output: 'out3\n',
        exitCode: 0,
      });

      const result = e2eShardOutputsMergeTransformer({
        shardOutputs: [shard3, shard1, shard2],
      });

      expect(result.output).toBe(
        '--- e2e shard 1/3 ---\nout1\n--- e2e shard 2/3 ---\nout2\n--- e2e shard 3/3 ---\nout3\n',
      );
    });

    it('EDGE: multiple failing shards => picks first non-zero exit code in shard order', () => {
      const shard1 = E2eShardOutputStub({
        shardIndex: 1,
        shardCount: 3,
        output: 'out1\n',
        exitCode: 0,
      });

      const shard2 = E2eShardOutputStub({
        shardIndex: 2,
        shardCount: 3,
        output: 'out2\n',
        exitCode: 2,
      });

      const shard3 = E2eShardOutputStub({
        shardIndex: 3,
        shardCount: 3,
        output: 'out3\n',
        exitCode: 1,
      });

      const result = e2eShardOutputsMergeTransformer({
        shardOutputs: [shard1, shard2, shard3],
      });

      expect(result.exitCode).toBe(2);
    });

    it('EDGE: multiple signals => picks first non-null signal in shard order', () => {
      const shard1 = E2eShardOutputStub({
        shardIndex: 1,
        shardCount: 3,
        output: 'out1\n',
        exitCode: 0,
        signal: null,
      });

      const shard2 = E2eShardOutputStub({
        shardIndex: 2,
        shardCount: 3,
        output: 'out2\n',
        exitCode: 143,
        signal: 'SIGTERM',
      });

      const shard3 = E2eShardOutputStub({
        shardIndex: 3,
        shardCount: 3,
        output: 'out3\n',
        exitCode: 137,
        signal: 'SIGKILL',
      });

      const result = e2eShardOutputsMergeTransformer({
        shardOutputs: [shard1, shard2, shard3],
      });

      expect(result.signal).toBe('SIGTERM');
    });

    it('EDGE: output without trailing newline => adds newline before next shard header', () => {
      const shard1 = E2eShardOutputStub({
        shardIndex: 1,
        shardCount: 2,
        output: 'line1',
        exitCode: 0,
      });

      const shard2 = E2eShardOutputStub({
        shardIndex: 2,
        shardCount: 2,
        output: 'line2',
        exitCode: 0,
      });

      const result = e2eShardOutputsMergeTransformer({
        shardOutputs: [shard1, shard2],
      });

      expect(result.output).toBe('--- e2e shard 1/2 ---\nline1\n--- e2e shard 2/2 ---\nline2');
    });
  });
});
