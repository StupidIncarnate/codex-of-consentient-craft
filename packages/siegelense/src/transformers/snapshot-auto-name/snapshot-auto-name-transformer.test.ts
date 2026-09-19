import { snapshotAutoNameTransformer } from './snapshot-auto-name-transformer';
import { RunIdStub } from '../../contracts/run-id/run-id.stub';
import { SnapshotBoundaryStub } from '../../contracts/snapshot-boundary/snapshot-boundary.stub';

describe('snapshotAutoNameTransformer', () => {
  describe('the automatic pair', () => {
    it('VALID: {runId: run_4, boundary: start} => returns "run_4:start"', () => {
      const result = snapshotAutoNameTransformer({
        runId: RunIdStub({ value: 'run_4' }),
        boundary: SnapshotBoundaryStub({ value: 'start' }),
      });

      expect(result).toBe('run_4:start');
    });

    it('VALID: {runId: run_4, boundary: end} => returns "run_4:end"', () => {
      const result = snapshotAutoNameTransformer({
        runId: RunIdStub({ value: 'run_4' }),
        boundary: SnapshotBoundaryStub({ value: 'end' }),
      });

      expect(result).toBe('run_4:end');
    });

    it('EDGE: {runId: run_1, boundary: start} => returns "run_1:start" at the first-run boundary', () => {
      const result = snapshotAutoNameTransformer({
        runId: RunIdStub({ value: 'run_1' }),
        boundary: SnapshotBoundaryStub({ value: 'start' }),
      });

      expect(result).toBe('run_1:start');
    });

    it('VALID: {runId: run_12, boundary: end} => returns "run_12:end", so a two-digit run is not truncated', () => {
      const result = snapshotAutoNameTransformer({
        runId: RunIdStub({ value: 'run_12' }),
        boundary: SnapshotBoundaryStub({ value: 'end' }),
      });

      expect(result).toBe('run_12:end');
    });
  });

  describe('two runs never collide', () => {
    it('VALID: {run_1 and run_2, both boundaries} => four distinct names', () => {
      const names = [
        snapshotAutoNameTransformer({
          runId: RunIdStub({ value: 'run_1' }),
          boundary: SnapshotBoundaryStub({ value: 'start' }),
        }),
        snapshotAutoNameTransformer({
          runId: RunIdStub({ value: 'run_1' }),
          boundary: SnapshotBoundaryStub({ value: 'end' }),
        }),
        snapshotAutoNameTransformer({
          runId: RunIdStub({ value: 'run_2' }),
          boundary: SnapshotBoundaryStub({ value: 'start' }),
        }),
        snapshotAutoNameTransformer({
          runId: RunIdStub({ value: 'run_2' }),
          boundary: SnapshotBoundaryStub({ value: 'end' }),
        }),
      ];

      expect(names).toStrictEqual(['run_1:start', 'run_1:end', 'run_2:start', 'run_2:end']);
    });
  });
});
