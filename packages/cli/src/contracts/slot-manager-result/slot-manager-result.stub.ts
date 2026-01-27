import type { StubArgument } from '@dungeonmaster/shared/@types';
import { StepIdStub } from '@dungeonmaster/shared/contracts';

import { slotManagerResultContract } from './slot-manager-result-contract';
import type { SlotManagerResult } from './slot-manager-result-contract';

export const SlotManagerResultStub = ({
  ...props
}: StubArgument<SlotManagerResult> = {}): SlotManagerResult =>
  slotManagerResultContract.parse({
    completed: true,
    ...props,
  });

export const SlotManagerResultUserInputNeededStub = ({
  ...props
}: StubArgument<Extract<SlotManagerResult, { completed: false }>> = {}): SlotManagerResult =>
  slotManagerResultContract.parse({
    completed: false,
    userInputNeeded: {
      stepId: StepIdStub(),
      question: 'What should be done?',
      context: 'Some context',
    },
    ...props,
  });
