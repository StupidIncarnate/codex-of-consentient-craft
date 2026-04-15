import type { StubArgument } from '@dungeonmaster/shared/@types';

import { agentPromptResultContract } from './agent-prompt-result-contract';
import type { AgentPromptResult } from './agent-prompt-result-contract';

export const AgentPromptResultStub = ({
  ...props
}: StubArgument<AgentPromptResult> = {}): AgentPromptResult =>
  agentPromptResultContract.parse({
    name: 'chaoswhisperer-gap-minion',
    model: 'sonnet',
    prompt: 'You are a Staff Engineer specializing in quest validation.',
    ...props,
  });
