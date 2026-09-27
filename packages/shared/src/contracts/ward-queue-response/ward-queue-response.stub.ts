import type { StubArgument } from '../../@types/stub-argument.type';

import { wardQueueResponseContract } from './ward-queue-response-contract';
import type { WardQueueResponse } from './ward-queue-response-contract';

export const WardQueueResponseStub = ({
  ...props
}: StubArgument<WardQueueResponse> = {}): WardQueueResponse =>
  wardQueueResponseContract.parse({
    ...props,
  });
