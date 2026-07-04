import type { StubArgument } from '@dungeonmaster/shared/@types';
import { DispatchStateStub } from '@dungeonmaster/shared/contracts';

import { dispatchPlayResponseContract } from './dispatch-play-response-contract';
import type { DispatchPlayResponse } from './dispatch-play-response-contract';

export const DispatchPlayResponseStub = ({
  ...props
}: StubArgument<DispatchPlayResponse> = {}): DispatchPlayResponse =>
  dispatchPlayResponseContract.parse({
    allowed: true,
    state: DispatchStateStub(),
    ...props,
  });
