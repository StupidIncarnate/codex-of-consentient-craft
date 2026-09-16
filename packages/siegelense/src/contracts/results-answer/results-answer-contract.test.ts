import { resultsAnswerContract } from './results-answer-contract';
import { ResultsAnswerStub } from './results-answer.stub';

describe('resultsAnswerContract', () => {
  describe('valid answers', () => {
    it('VALID: {kind: "steps", rows: two step readings} => parses a steps answer carrying rows', () => {
      const answer = ResultsAnswerStub({
        instanceId: 'inst_7f3a9c21',
        instanceState: 'alive',
        runId: 'run_2',
        kind: 'steps',
        step: null,
        verb: null,
        matched: 2,
        returned: 2,
        rows: ['{"step":1,"verb":"goto"}', '{"step":2,"verb":"click"}'],
      });

      const result = resultsAnswerContract.parse(answer);

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        instanceState: 'alive',
        runId: 'run_2',
        kind: 'steps',
        step: null,
        verb: null,
        prunedAtMs: null,
        prunedByRule: null,
        matched: 2,
        returned: 2,
        truncated: false,
        rows: ['{"step":1,"verb":"goto"}', '{"step":2,"verb":"click"}'],
        storedReturn: null,
      });
    });

    it('VALID: {instanceState: "pruned"} => parses a pruned answer with rows: [] and a reason, as a complete answer rather than an empty result', () => {
      const answer = ResultsAnswerStub({
        instanceId: 'inst_7f3a9c21',
        instanceState: 'pruned',
        prunedAtMs: 1_700_003_000_000,
        prunedByRule: 'olderThan 7d',
        rows: [],
      });

      const result = resultsAnswerContract.parse(answer);

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        instanceState: 'pruned',
        runId: null,
        kind: null,
        step: null,
        verb: null,
        prunedAtMs: 1_700_003_000_000,
        prunedByRule: 'olderThan 7d',
        matched: 0,
        returned: 0,
        truncated: false,
        rows: [],
        storedReturn: null,
      });
    });

    it('VALID: {instanceState: "unknown"} => parses an unknown-instance answer with rows: [], as a complete answer rather than an empty result', () => {
      const answer = ResultsAnswerStub({
        instanceId: 'inst_00000000',
        instanceState: 'unknown',
        rows: [],
      });

      const result = resultsAnswerContract.parse(answer);

      expect(result).toStrictEqual({
        instanceId: 'inst_00000000',
        instanceState: 'unknown',
        runId: null,
        kind: null,
        step: null,
        verb: null,
        prunedAtMs: null,
        prunedByRule: null,
        matched: 0,
        returned: 0,
        truncated: false,
        rows: [],
        storedReturn: null,
      });
    });

    it('VALID: {truncated: true, matched: 900, returned: 200} => parses a capped answer reporting both counts, not only the one it returned', () => {
      const answer = ResultsAnswerStub({
        instanceId: 'inst_7f3a9c21',
        instanceState: 'alive',
        matched: 900,
        returned: 200,
        truncated: true,
      });

      const result = resultsAnswerContract.parse(answer);

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        instanceState: 'alive',
        runId: null,
        kind: null,
        step: null,
        verb: null,
        prunedAtMs: null,
        prunedByRule: null,
        matched: 900,
        returned: 200,
        truncated: true,
        rows: [],
        storedReturn: null,
      });
    });
  });

  describe('invalid answers', () => {
    it('INVALID: {missing matched} => throws Required', () => {
      expect(() =>
        resultsAnswerContract.parse({
          instanceId: 'inst_7f3a9c21',
          instanceState: 'alive',
          runId: null,
          kind: null,
          step: null,
          verb: null,
          prunedAtMs: null,
          prunedByRule: null,
          returned: 0,
          truncated: false,
          rows: [],
          storedReturn: null,
        }),
      ).toThrow(/Required/u);
    });
  });
});
