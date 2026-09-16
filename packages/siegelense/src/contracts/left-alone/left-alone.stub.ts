import type { StubArgument } from '@dungeonmaster/shared/@types';

import { InstanceIdStub } from '../instance-id/instance-id.stub';
import { leftAloneContract } from './left-alone-contract';
import type { LeftAlone } from './left-alone-contract';

export const LeftAloneStub = ({ ...props }: StubArgument<LeftAlone> = {}): LeftAlone =>
  leftAloneContract.parse({
    id: InstanceIdStub({ value: 'inst_7f3a' }),
    why: 'live — last beat 2s ago',
    ...props,
  });
