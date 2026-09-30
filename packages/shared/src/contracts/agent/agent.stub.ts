import type { StubArgument } from '../../@types/stub-argument.type';

import { agentContract } from './agent-contract';
import type { Agent } from './agent-contract';

export const AgentStub = ({ ...props }: StubArgument<Agent> = {}): Agent =>
  agentContract.parse({
    id: 'agent-abc',
    ...props,
  });
