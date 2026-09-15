import type { StubArgument } from '@dungeonmaster/shared/@types';

import { driverResponseContract } from './driver-response-contract';
import type { DriverResponse } from './driver-response-contract';

export const DriverResponseStub = ({
  ...props
}: StubArgument<DriverResponse> = {}): DriverResponse =>
  driverResponseContract.parse({
    ok: true,
    payload: '',
    error: null,
    ...props,
  });
