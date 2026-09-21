import type { StubArgument } from '@dungeonmaster/shared/@types';

import { getQuestWorkInputContract } from './get-quest-work-input-contract';
import type { GetQuestWorkInput } from './get-quest-work-input-contract';

export const GetQuestWorkInputStub = ({
  ...props
}: StubArgument<GetQuestWorkInput> = {}): GetQuestWorkInput =>
  getQuestWorkInputContract.parse({
    questId: 'add-auth',
    workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    ...props,
  });
