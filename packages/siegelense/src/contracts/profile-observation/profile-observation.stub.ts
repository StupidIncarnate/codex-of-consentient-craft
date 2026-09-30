import type { StubArgument } from '@dungeonmaster/shared/@types';

import { InstanceIdStub } from '../instance-id/instance-id.stub';
import { SpecHashStub } from '../spec-hash/spec-hash.stub';
import { profileObservationContract } from './profile-observation-contract';
import type { ProfileObservation } from './profile-observation-contract';

export const ProfileObservationStub = ({
  ...props
}: StubArgument<ProfileObservation> = {}): ProfileObservation =>
  profileObservationContract.parse({
    instanceId: InstanceIdStub(),
    specHash: SpecHashStub(),
    firstBeatAtMs: 1,
    measuredAtMs: 1,
    pools: [{ poolSize: 1, peakMB: 2600, steadySumMB: 12_600, steadyBeats: 7 }],
    ...props,
  });
