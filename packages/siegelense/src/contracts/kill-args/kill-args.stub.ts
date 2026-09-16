import type { StubArgument } from '@dungeonmaster/shared/@types';

import { killArgsContract } from './kill-args-contract';
import type { KillArgs } from './kill-args-contract';

export const KillArgsStub = ({ ...props }: StubArgument<KillArgs> = {}): KillArgs =>
  killArgsContract.parse({
    instanceId: 'inst_7f3a9c21',
    ...props,
  });
