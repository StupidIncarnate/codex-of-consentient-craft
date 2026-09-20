import type { StubArgument } from '@dungeonmaster/shared/@types';

import { untilResponseContract } from './until-response-contract';
import type { UntilResponse } from './until-response-contract';

export const UntilResponseStub = ({ ...props }: StubArgument<UntilResponse> = {}): UntilResponse =>
  untilResponseContract.parse({
    method: 'POST',
    path: '/api/quests',
    ...props,
  });
