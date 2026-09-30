import type { StubArgument } from '@dungeonmaster/shared/@types';
import { RateLimitsSnapshotStub } from '@dungeonmaster/shared/contracts/rate-limits-snapshot/rate-limits-snapshot.stub';
import { rateLimitsGetResponseDataContract } from './rate-limits-get-response-data-contract';
import type { RateLimitsGetResponseData } from './rate-limits-get-response-data-contract';

export const RateLimitsGetResponseDataStub = ({
  ...props
}: StubArgument<RateLimitsGetResponseData> = {}): RateLimitsGetResponseData =>
  rateLimitsGetResponseDataContract.parse({
    snapshot: RateLimitsSnapshotStub(),
    ...props,
  });
