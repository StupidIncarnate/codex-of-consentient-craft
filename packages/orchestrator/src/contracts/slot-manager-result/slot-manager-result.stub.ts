import type { StubArgument } from '@dungeonmaster/shared/@types';
import { DependencyStepStub } from '@dungeonmaster/shared/contracts';

import { slotManagerResultContract } from './slot-manager-result-contract';
import type { SlotManagerResult } from './slot-manager-result-contract';

export const SlotManagerResultStub = ({
  ...props
}: StubArgument<SlotManagerResult> = {}): SlotManagerResult =>
  slotManagerResultContract.parse({
    completed: true,
    ...props,
  });

export const SlotManagerResultIncompleteStub = ({
  ...props
}: StubArgument<Extract<SlotManagerResult, { completed: false }>> = {}): SlotManagerResult =>
  slotManagerResultContract.parse({
    completed: false,
    incompleteSteps: [DependencyStepStub()],
    ...props,
  });
