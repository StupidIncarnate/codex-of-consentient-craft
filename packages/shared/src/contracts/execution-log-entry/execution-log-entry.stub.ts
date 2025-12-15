import type { StubArgument } from '@dungeonmaster/shared/@types';

import { executionLogEntryContract } from './execution-log-entry-contract';
import type { ExecutionLogEntry } from './execution-log-entry-contract';

export const ExecutionLogEntryStub = ({
  ...props
}: StubArgument<ExecutionLogEntry> = {}): ExecutionLogEntry =>
  executionLogEntryContract.parse({
    report: '001-pathseeker-report.json',
    timestamp: '2024-01-15T10:00:00.000Z',
    ...props,
  });
