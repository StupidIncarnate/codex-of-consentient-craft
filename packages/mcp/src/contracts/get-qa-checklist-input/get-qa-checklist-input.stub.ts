import type { StubArgument } from '@dungeonmaster/shared/@types';

import { getQaChecklistInputContract } from './get-qa-checklist-input-contract';
import type { GetQaChecklistInput } from './get-qa-checklist-input-contract';

export const GetQaChecklistInputStub = ({
  ...props
}: StubArgument<GetQaChecklistInput> = {}): GetQaChecklistInput =>
  getQaChecklistInputContract.parse({
    questId: 'add-auth',
    ...props,
  });
