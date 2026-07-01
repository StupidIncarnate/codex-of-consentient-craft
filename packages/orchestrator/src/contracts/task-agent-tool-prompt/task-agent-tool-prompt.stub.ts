import { taskAgentToolPromptContract } from './task-agent-tool-prompt-contract';
import type { TaskAgentToolPrompt } from './task-agent-tool-prompt-contract';

export const TaskAgentToolPromptStub = (
  { value }: { value: string } = { value: 'Implement the auth slice' },
): TaskAgentToolPrompt => taskAgentToolPromptContract.parse(value);
