import { agentFamilyNameContract } from './agent-family-name-contract';
import type { AgentFamilyName } from './agent-family-name-contract';

export const AgentFamilyNameStub = (
  { value }: { value: string } = { value: 'siegemaster' },
): AgentFamilyName => agentFamilyNameContract.parse(value);
