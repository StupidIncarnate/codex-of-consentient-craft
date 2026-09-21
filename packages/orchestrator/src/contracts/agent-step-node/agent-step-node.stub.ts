import type { StubArgument } from '@dungeonmaster/shared/@types';

import { agentStepNodeContract } from './agent-step-node-contract';
import type { AgentStepNode } from './agent-step-node-contract';

export const AgentStepNodeStub = ({ ...props }: StubArgument<AgentStepNode> = {}): AgentStepNode =>
  agentStepNodeContract.parse({
    role: 'worker',
    ...props,
  });
