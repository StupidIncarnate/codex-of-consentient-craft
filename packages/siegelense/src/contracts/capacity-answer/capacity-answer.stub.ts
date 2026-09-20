import type { StubArgument } from '@dungeonmaster/shared/@types';

import { CapacityMeasuredStub } from '../capacity-measured/capacity-measured.stub';
import { CapacityProfileStub } from '../capacity-profile/capacity-profile.stub';
import { capacityAnswerContract } from './capacity-answer-contract';
import type { CapacityAnswer } from './capacity-answer-contract';

export const CapacityAnswerStub = ({
  ...props
}: StubArgument<CapacityAnswer> = {}): CapacityAnswer =>
  capacityAnswerContract.parse({
    suggested: 2,
    ceiling: 3,
    why:
      'profile 2600MB peak / 1800MB steady at pool size 1, from 9 runs; ' +
      'free RAM 5320MB less 512MB headroom; 1 siege instance already up',
    measured: CapacityMeasuredStub(),
    profile: CapacityProfileStub(),
    ...props,
  });
