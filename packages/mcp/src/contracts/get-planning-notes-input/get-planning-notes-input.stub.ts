import type { StubArgument } from '@dungeonmaster/shared/@types';

import { getPlanningNotesInputContract } from './get-planning-notes-input-contract';
import type { GetPlanningNotesInput } from './get-planning-notes-input-contract';

export const GetPlanningNotesInputStub = ({
  ...props
}: StubArgument<GetPlanningNotesInput> = {}): GetPlanningNotesInput =>
  getPlanningNotesInputContract.parse({
    questId: 'add-auth',
    ...props,
  });
