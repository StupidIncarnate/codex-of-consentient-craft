import type { StubArgument } from '@dungeonmaster/shared/@types';

import { wardQueueResponseContract } from './ward-queue-response-contract';
import type { WardQueueResponse } from './ward-queue-response-contract';

export const WardQueueResponseStub = ({
  ...props
}: StubArgument<WardQueueResponse> = {}): WardQueueResponse =>
  wardQueueResponseContract.parse({
    ...props,
  });
