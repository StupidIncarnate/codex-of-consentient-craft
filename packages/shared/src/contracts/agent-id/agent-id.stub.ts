import { agentContract } from '../agent/agent-contract';

type AgentId = ReturnType<typeof agentContract.shape.id.parse>;

export const AgentIdStub = ({ value }: { value: string } = { value: 'agent-abc' }): AgentId =>
  agentContract.shape.id.parse(value);
