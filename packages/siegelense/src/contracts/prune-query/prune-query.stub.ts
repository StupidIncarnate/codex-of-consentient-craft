import type { StubArgument } from '@dungeonmaster/shared/@types';

import { ElapsedTextStub } from '../elapsed-text/elapsed-text.stub';
import { pruneQueryContract } from './prune-query-contract';
import type { PruneQuery } from './prune-query-contract';

export const PruneQueryStub = ({ ...props }: StubArgument<PruneQuery> = {}): PruneQuery =>
  pruneQueryContract.parse({
    instanceId: null,
    kind: null,
    olderThan: ElapsedTextStub({ value: '7d' }),
    ...props,
  });
