import { executionLogEntryOutcomeContract } from './execution-log-entry-outcome-contract';
import type { ExecutionLogEntryOutcome } from './execution-log-entry-outcome-contract';

export const ExecutionLogEntryOutcomeStub = (
  { value }: { value: string } = { value: 'pass' },
): ExecutionLogEntryOutcome => executionLogEntryOutcomeContract.parse(value);
