import type { StubArgument } from '@dungeonmaster/shared/@types';

import { leaseContract } from './lease-contract';
import type { Lease } from './lease-contract';

export const LeaseStub = ({ ...props }: StubArgument<Lease> = {}): Lease =>
  leaseContract.parse({
    leaseId: 'lease-test-1',
    tool: 'ward',
    label: '@dungeonmaster/web',
    ownerPid: 12345,
    state: 'starting',
    expectedPeakMB: 512,
    currentRssMB: null,
    startedAtMs: 1_700_000_000_000,
    lastBeatMs: 1_700_000_000_000,
    ...props,
  });
