import { agentTypeContract } from './agent-type-contract';
import type { AgentType } from './agent-type-contract';

export const AgentTypeStub = ({ value }: { value: string } = { value: 'ward' }): AgentType =>
  agentTypeContract.parse(value);
