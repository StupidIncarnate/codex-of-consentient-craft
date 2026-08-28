import type { StubArgument } from '@dungeonmaster/shared/@types';

import { healthStatusPayloadContract } from './health-status-payload-contract';
import type { HealthStatusPayload } from './health-status-payload-contract';

export const HealthStatusPayloadStub = ({
  ...props
}: StubArgument<HealthStatusPayload> = {}): HealthStatusPayload =>
  healthStatusPayloadContract.parse({
    status: 'ok',
    uptimeSeconds: 11520,
    version: '0.1.0',
    ...props,
  });
