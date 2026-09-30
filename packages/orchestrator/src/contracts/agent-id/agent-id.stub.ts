import type { Agent } from '@dungeonmaster/shared/contracts';
import { agentContract } from '@dungeonmaster/shared/contracts';

export const AgentIdStub = ({ value }: { value: string } = { value: 'agent-abc' }): Agent['id'] => {
  const agentIdContract = agentContract.shape.id;
  return agentIdContract.parse(value);
};
