import type { Agent } from '../agent/agent-contract';
import { agentContract } from '../agent/agent-contract';

export const AgentIdStub = ({ value }: { value: string } = { value: 'agent-abc' }): Agent['id'] => {
  const agentIdContract = agentContract.shape.id;
  return agentIdContract.parse(value);
};
