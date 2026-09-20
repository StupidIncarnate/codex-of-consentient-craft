import type { StubArgument } from '@dungeonmaster/shared/@types';
import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { InstanceIdStub } from '../instance-id/instance-id.stub';
import { pruneRefusalContract } from './prune-refusal-contract';
import type { PruneRefusal } from './prune-refusal-contract';

export const PruneRefusalStub = ({ ...props }: StubArgument<PruneRefusal> = {}): PruneRefusal =>
  pruneRefusalContract.parse({
    id: InstanceIdStub({ value: 'inst_1d09' }),
    why: ContentTextStub({
      value: 'run_7 cited by a VERIFIED prelude in /repo/.quest-plans/1dac5395/path-3.md',
    }),
    ...props,
  });
