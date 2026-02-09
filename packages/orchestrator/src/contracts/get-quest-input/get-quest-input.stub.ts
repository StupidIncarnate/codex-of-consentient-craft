import type { StubArgument } from '@dungeonmaster/shared/@types';

import { getQuestInputContract } from './get-quest-input-contract';
import type { GetQuestInput } from './get-quest-input-contract';

export const GetQuestInputStub = ({ ...props }: StubArgument<GetQuestInput> = {}): GetQuestInput =>
  getQuestInputContract.parse({
    questId: 'test-quest',
    ...props,
  });
