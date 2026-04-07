import { agentPromptNameContract } from './agent-prompt-name-contract';
import type { AgentPromptName } from './agent-prompt-name-contract';

export const AgentPromptNameStub = ({ value }: { value?: string } = {}): AgentPromptName =>
  agentPromptNameContract.parse(value ?? 'quest-gap-reviewer');
