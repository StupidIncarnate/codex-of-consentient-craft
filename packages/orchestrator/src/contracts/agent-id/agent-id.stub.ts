import type { Agent } from '@dungeonmaster/shared/contracts';
import { agentContract } from '@dungeonmaster/shared/contracts';

export const AgentIdStub = ({ value }: { value: string } = { value: 'agent-abc' }): Agent['id'] =>
  agentContract.shape.id.parse(value);
