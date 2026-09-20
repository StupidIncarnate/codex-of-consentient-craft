import type { StubArgument } from '@dungeonmaster/shared/@types';

import { statusArgsContract } from './status-args-contract';
import type { StatusArgs } from './status-args-contract';

export const StatusArgsStub = ({ ...props }: StubArgument<StatusArgs> = {}): StatusArgs =>
  statusArgsContract.parse({
    instanceId: null,
    human: false,
    ...props,
  });
