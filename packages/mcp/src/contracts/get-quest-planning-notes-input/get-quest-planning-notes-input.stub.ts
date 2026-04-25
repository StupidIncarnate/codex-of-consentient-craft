import type { StubArgument } from '@dungeonmaster/shared/@types';

import { getQuestPlanningNotesInputContract } from './get-quest-planning-notes-input-contract';
import type { GetQuestPlanningNotesInput } from './get-quest-planning-notes-input-contract';

export const GetQuestPlanningNotesInputStub = ({
  ...props
}: StubArgument<GetQuestPlanningNotesInput> = {}): GetQuestPlanningNotesInput =>
  getQuestPlanningNotesInputContract.parse({
    questId: 'add-auth',
    ...props,
  });
