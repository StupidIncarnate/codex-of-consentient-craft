import type { StubArgument } from '@dungeonmaster/shared/@types';

import { driverRequestContract } from './driver-request-contract';
import type { DriverRequest } from './driver-request-contract';

export const DriverRequestStub = ({ ...props }: StubArgument<DriverRequest> = {}): DriverRequest =>
  driverRequestContract.parse({
    kind: 'ping',
    payload: '',
    ...props,
  });
