import { agentOutputLineContract } from './agent-output-line-contract';
import type { AgentOutputLine } from './agent-output-line-contract';

export const AgentOutputLineStub = ({ value }: { value?: string } = {}): AgentOutputLine =>
  agentOutputLineContract.parse(value ?? 'Building auth guard...');
