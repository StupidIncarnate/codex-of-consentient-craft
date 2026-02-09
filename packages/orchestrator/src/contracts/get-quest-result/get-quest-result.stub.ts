import type { StubArgument } from '@dungeonmaster/shared/@types';
import { QuestStub } from '@dungeonmaster/shared/contracts';

import { getQuestResultContract } from './get-quest-result-contract';
import type { GetQuestResult } from './get-quest-result-contract';

export const GetQuestResultStub = ({
  ...props
}: StubArgument<GetQuestResult> = {}): GetQuestResult =>
  getQuestResultContract.parse({
    success: true,
    quest: QuestStub(),
    ...props,
  });
