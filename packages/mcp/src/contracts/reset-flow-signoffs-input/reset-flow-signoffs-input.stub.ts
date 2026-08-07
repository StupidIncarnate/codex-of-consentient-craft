import type { StubArgument } from '@dungeonmaster/shared/@types';

import { resetFlowSignoffsInputContract } from './reset-flow-signoffs-input-contract';
import type { ResetFlowSignoffsInput } from './reset-flow-signoffs-input-contract';

export const ResetFlowSignoffsInputStub = ({
  ...props
}: StubArgument<ResetFlowSignoffsInput> = {}): ResetFlowSignoffsInput =>
  resetFlowSignoffsInputContract.parse({
    questId: 'add-auth',
    workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    flowId: 'login-flow',
    reason: 'Fixed the redirect guard the walk exposed, so every sign-off on this flow is stale.',
    ...props,
  });
