import type { StubArgument } from '@dungeonmaster/shared/@types';

import { resetFlowSignoffsResultContract } from './reset-flow-signoffs-result-contract';
import type { ResetFlowSignoffsResult } from './reset-flow-signoffs-result-contract';

export const ResetFlowSignoffsResultStub = ({
  ...props
}: StubArgument<ResetFlowSignoffsResult> = {}): ResetFlowSignoffsResult =>
  resetFlowSignoffsResultContract.parse({
    clearedCount: 12,
    noteId: 'walk-reset-login-flow-1',
    ...props,
  });
