import type { StubArgument } from '@dungeonmaster/shared/@types';

import { getBlightChecklistInputContract } from './get-blight-checklist-input-contract';
import type { GetBlightChecklistInput } from './get-blight-checklist-input-contract';

export const GetBlightChecklistInputStub = ({
  ...props
}: StubArgument<GetBlightChecklistInput> = {}): GetBlightChecklistInput =>
  getBlightChecklistInputContract.parse({
    questId: 'add-auth',
    ...props,
  });
