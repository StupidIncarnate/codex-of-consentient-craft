import { agentIdContract } from './agent-id-contract';

type AgentId = ReturnType<typeof agentIdContract.parse>;

export const AgentIdStub = ({ value }: { value: string } = { value: 'agent-abc' }): AgentId =>
  agentIdContract.parse(value);
