import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questWorkInputContract } from './quest-work-input-contract';
import type { QuestWorkInput } from './quest-work-input-contract';

export const QuestWorkInputStub = ({
  ...props
}: StubArgument<QuestWorkInput> = {}): QuestWorkInput =>
  questWorkInputContract.parse({
    questId: 'add-auth',
    workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    payload: {
      kind: 'outcome',
      word: 'done',
      reason: 'every assigned unit is met',
    },
    ...props,
  });
