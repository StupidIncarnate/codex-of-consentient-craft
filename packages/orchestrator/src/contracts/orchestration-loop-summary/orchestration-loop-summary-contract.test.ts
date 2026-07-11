import { OrchestrationLoopSummaryStub } from './orchestration-loop-summary.stub';
import { orchestrationLoopSummaryContract } from './orchestration-loop-summary-contract';

describe('orchestrationLoopSummaryContract', () => {
  describe('valid input', () => {
    it('VALID: {value: snapshot string} => returns branded OrchestrationLoopSummary', () => {
      const result = OrchestrationLoopSummaryStub({
        value:
          '[orchestration-loop] quest=demo status=in_progress items=1 (ready=1 running=0 waiting=0 done=0 failed=0 skipped=0)',
      });

      expect(result).toBe(
        '[orchestration-loop] quest=demo status=in_progress items=1 (ready=1 running=0 waiting=0 done=0 failed=0 skipped=0)',
      );
    });
  });

  describe('invalid input', () => {
    it('INVALID: {value: number} => throws ZodError', () => {
      expect(() => orchestrationLoopSummaryContract.parse(123 as never)).toThrow(
        /Expected string/u,
      );
    });
  });
});
