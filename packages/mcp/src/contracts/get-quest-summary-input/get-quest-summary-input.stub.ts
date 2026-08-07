import type { StubArgument } from '@dungeonmaster/shared/@types';

import { getQuestSummaryInputContract } from './get-quest-summary-input-contract';
import type { GetQuestSummaryInput } from './get-quest-summary-input-contract';

export const GetQuestSummaryInputStub = ({
  ...props
}: StubArgument<GetQuestSummaryInput> = {}): GetQuestSummaryInput =>
  getQuestSummaryInputContract.parse({
    questId: 'add-auth',
    ...props,
  });
