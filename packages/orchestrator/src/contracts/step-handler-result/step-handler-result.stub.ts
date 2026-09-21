import type { StubArgument } from '@dungeonmaster/shared/@types';

import { stepHandlerResultContract } from './step-handler-result-contract';
import type { StepHandlerResult } from './step-handler-result-contract';

export const StepHandlerResultStub = ({
  ...props
}: StubArgument<StepHandlerResult> = {}): StepHandlerResult =>
  stepHandlerResultContract.parse({
    outcome: 'done',
    detail: 'run: 1780108054226-a080  lint: PASS',
    ...props,
  });
