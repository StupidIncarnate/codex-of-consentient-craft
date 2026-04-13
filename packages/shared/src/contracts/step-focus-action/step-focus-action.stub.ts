import type { StubArgument } from '@dungeonmaster/shared/@types';

import { stepFocusActionContract } from './step-focus-action-contract';
import type { StepFocusAction } from './step-focus-action-contract';

export const StepFocusActionStub = ({
  ...props
}: StubArgument<StepFocusAction> = {}): StepFocusAction =>
  stepFocusActionContract.parse({
    kind: 'verification',
    description: 'Run ward and assert zero failures',
    ...props,
  });
