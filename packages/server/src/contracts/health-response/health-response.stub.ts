import type { StubArgument } from '@dungeonmaster/shared/@types';
import { healthResponseContract } from './health-response-contract';
import type { HealthResponse } from './health-response-contract';

export const HealthResponseStub = ({
  ...props
}: StubArgument<HealthResponse> = {}): HealthResponse =>
  healthResponseContract.parse({
    status: 'ok',
    timestamp: '2024-01-01T00:00:00Z',
    ...props,
  });
