import { driverRequestKindContract } from './driver-request-kind-contract';
import type { DriverRequestKind } from './driver-request-kind-contract';

export const DriverRequestKindStub = (
  { value }: { value: string } = { value: 'ping' },
): DriverRequestKind => driverRequestKindContract.parse(value);
