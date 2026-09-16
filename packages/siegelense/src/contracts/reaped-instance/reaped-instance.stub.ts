import type { StubArgument } from '@dungeonmaster/shared/@types';

import { InstanceIdStub } from '../instance-id/instance-id.stub';
import { reapedInstanceContract } from './reaped-instance-contract';
import type { ReapedInstance } from './reaped-instance-contract';

export const ReapedInstanceStub = ({
  ...props
}: StubArgument<ReapedInstance> = {}): ReapedInstance =>
  reapedInstanceContract.parse({
    id: InstanceIdStub({ value: 'inst_9b2c' }),
    staleFor: '9h',
    killed: [33_812, 33_840],
    homeRemoved: true,
    ...props,
  });
