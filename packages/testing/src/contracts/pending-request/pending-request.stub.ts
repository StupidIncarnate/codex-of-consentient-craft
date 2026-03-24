import type { StubArgument } from '@dungeonmaster/shared/@types';
import { pendingRequestContract, type PendingRequest } from './pending-request-contract';

export const PendingRequestStub = ({
  ...props
}: StubArgument<PendingRequest> = {}): PendingRequest =>
  pendingRequestContract.parse({
    method: 'GET',
    url: 'http://test.local/api/guilds',
    timestampMs: 1700000000000,
    ...props,
  });
