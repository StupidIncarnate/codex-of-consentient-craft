import type { StubArgument } from '@dungeonmaster/shared/@types';

import { PruneQueryStub } from '../prune-query/prune-query.stub';
import { pruneArgsContract } from './prune-args-contract';
import type { PruneArgs } from './prune-args-contract';

export const PruneArgsStub = ({ ...props }: StubArgument<PruneArgs> = {}): PruneArgs =>
  pruneArgsContract.parse({
    query: PruneQueryStub(),
    human: true,
    ...props,
  });
