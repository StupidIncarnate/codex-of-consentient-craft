import { agentRoleContract } from './agent-role-contract';
import type { AgentRole } from './agent-role-contract';

export const AgentRoleStub = ({ value }: { value?: AgentRole } = {}): AgentRole =>
  agentRoleContract.parse(value ?? 'pathseeker');
