import type { StubArgument } from '@dungeonmaster/shared/@types';

import { SpecNameStub } from '../spec-name/spec-name.stub';
import { capacityProfileContract } from './capacity-profile-contract';
import type { CapacityProfile } from './capacity-profile-contract';

export const CapacityProfileStub = ({
  ...props
}: StubArgument<CapacityProfile> = {}): CapacityProfile =>
  capacityProfileContract.parse({
    spec: SpecNameStub(),
    poolSize: 1,
    steadyMB: 1800,
    peakMB: 2600,
    fromRuns: 9,
    ...props,
  });
