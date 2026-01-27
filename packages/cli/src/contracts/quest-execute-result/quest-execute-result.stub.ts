import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questExecuteResultContract } from './quest-execute-result-contract';
import type { QuestExecuteResult } from './quest-execute-result-contract';

export const QuestExecuteResultStub = ({
  ...props
}: StubArgument<QuestExecuteResult> = {}): QuestExecuteResult =>
  questExecuteResultContract.parse({
    success: true,
    ...props,
  });

export const QuestExecuteResultFailedStub = ({
  ...props
}: StubArgument<Extract<QuestExecuteResult, { success: false }>> = {}): QuestExecuteResult =>
  questExecuteResultContract.parse({
    success: false,
    reason: 'Test failure reason',
    ...props,
  });
