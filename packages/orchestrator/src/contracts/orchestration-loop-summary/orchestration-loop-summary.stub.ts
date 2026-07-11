import {
  orchestrationLoopSummaryContract,
  type OrchestrationLoopSummary,
} from './orchestration-loop-summary-contract';

export const OrchestrationLoopSummaryStub = ({
  value,
}: { value?: string } = {}): OrchestrationLoopSummary =>
  orchestrationLoopSummaryContract.parse(
    value ??
      '[orchestration-loop] quest=demo status=in_progress items=0 (ready=0 running=0 waiting=0 done=0 failed=0 skipped=0)',
  );
