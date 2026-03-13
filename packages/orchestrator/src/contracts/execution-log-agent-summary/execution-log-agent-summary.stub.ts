import type { StubArgument } from '@dungeonmaster/shared/@types';

import { executionLogAgentSummaryContract } from './execution-log-agent-summary-contract';
import type { ExecutionLogAgentSummary } from './execution-log-agent-summary-contract';

export const ExecutionLogAgentSummaryStub = ({
  ...props
}: StubArgument<ExecutionLogAgentSummary> = {}): ExecutionLogAgentSummary =>
  executionLogAgentSummaryContract.parse({
    failCount: 0,
    ...props,
  });
