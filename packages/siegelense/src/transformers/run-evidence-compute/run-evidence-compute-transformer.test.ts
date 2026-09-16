import { runEvidenceComputeTransformer } from './run-evidence-compute-transformer';

describe('runEvidenceComputeTransformer', () => {
  describe('no runs', () => {
    it('EMPTY: {entries: []} => runCount 0, latestRunId null, evidenceComplete true', () => {
      const result = runEvidenceComputeTransformer({ entries: [] });

      expect(result).toStrictEqual({ runCount: 0, latestRunId: null, evidenceComplete: true });
    });

    it('EMPTY: {entries with no transcripts} => runCount 0, latestRunId null, evidenceComplete true', () => {
      const result = runEvidenceComputeTransformer({
        entries: ['heartbeat.json', 'console.jsonl'],
      });

      expect(result).toStrictEqual({ runCount: 0, latestRunId: null, evidenceComplete: true });
    });
  });

  describe('every run finished cleanly', () => {
    it('VALID: {run_1.jsonl, run_1.json} => runCount 1, latestRunId run_1, evidenceComplete true', () => {
      const result = runEvidenceComputeTransformer({
        entries: ['run_1.jsonl', 'run_1.json'],
      });

      expect(result).toStrictEqual({ runCount: 1, latestRunId: 'run_1', evidenceComplete: true });
    });

    it('VALID: {run_1 and run_2, both complete} => runCount 2, latestRunId run_2, evidenceComplete true', () => {
      const result = runEvidenceComputeTransformer({
        entries: ['run_1.jsonl', 'run_1.json', 'run_2.jsonl', 'run_2.json'],
      });

      expect(result).toStrictEqual({ runCount: 2, latestRunId: 'run_2', evidenceComplete: true });
    });

    it('VALID: {run_1, run_2, run_10} => latestRunId run_10 by NUMBER, not string order', () => {
      const result = runEvidenceComputeTransformer({
        entries: [
          'run_1.jsonl',
          'run_1.json',
          'run_2.jsonl',
          'run_2.json',
          'run_10.jsonl',
          'run_10.json',
        ],
      });

      expect(result).toStrictEqual({ runCount: 3, latestRunId: 'run_10', evidenceComplete: true });
    });
  });

  describe('the crashed-run shape — a .jsonl with no matching .json', () => {
    it('EDGE: {run_1 complete, run_2.jsonl only} => runCount 2, latestRunId run_2, evidenceComplete false', () => {
      const result = runEvidenceComputeTransformer({
        entries: ['run_1.jsonl', 'run_1.json', 'run_2.jsonl'],
      });

      expect(result).toStrictEqual({ runCount: 2, latestRunId: 'run_2', evidenceComplete: false });
    });

    it('EDGE: {run_1.jsonl only, no run_1.json} => runCount 1, latestRunId run_1, evidenceComplete false', () => {
      const result = runEvidenceComputeTransformer({
        entries: ['run_1.jsonl'],
      });

      expect(result).toStrictEqual({ runCount: 1, latestRunId: 'run_1', evidenceComplete: false });
    });
  });

  describe('extra directory entries the runs dir may also hold', () => {
    it('EDGE: {a run_2 shots subdirectory alongside its files} => the subdirectory name is not mistaken for a transcript', () => {
      const result = runEvidenceComputeTransformer({
        entries: ['run_2.jsonl', 'run_2.json', 'run_2'],
      });

      expect(result).toStrictEqual({ runCount: 1, latestRunId: 'run_2', evidenceComplete: true });
    });
  });
});
