import { agentIdContract } from './agent-id-contract';
import type { AgentId } from './agent-id-contract';

export const AgentIdStub = ({ value }: { value: string } = { value: 'agent-abc' }): AgentId =>
  agentIdContract.parse(value);
