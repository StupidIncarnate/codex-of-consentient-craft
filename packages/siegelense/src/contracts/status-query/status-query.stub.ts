import type { StubArgument } from '@dungeonmaster/shared/@types';

import { statusQueryContract } from './status-query-contract';
import type { StatusQuery } from './status-query-contract';

export const StatusQueryStub = ({ ...props }: StubArgument<StatusQuery> = {}): StatusQuery =>
  statusQueryContract.parse({
    instanceId: null,
    ...props,
  });
