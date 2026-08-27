import type { StubArgument } from '@dungeonmaster/shared/@types';

import { healthStatusPayloadContract } from './health-status-payload-contract';
import type { HealthStatusPayload } from './health-status-payload-contract';

export const HealthStatusPayloadStub = ({
  ...props
}: StubArgument<HealthStatusPayload> = {}): HealthStatusPayload =>
  healthStatusPayloadContract.parse({
    status: 'ok',
    uptimeSeconds: 120,
    version: '1.0.0',
    ...props,
  });
