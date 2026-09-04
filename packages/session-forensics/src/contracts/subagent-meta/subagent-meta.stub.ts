import { subagentMetaContract, type SubagentMeta } from './subagent-meta-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const SubagentMetaStub = ({ ...props }: StubArgument<SubagentMeta> = {}): SubagentMeta =>
  subagentMetaContract.parse({
    agentType: 'general-purpose',
    description: 'Add pasted-image upload contract',
    toolUseId: 'toolu_013MwHATQFcXS5tJjdhV8YMP',
    spawnDepth: 1,
    ...props,
  });
