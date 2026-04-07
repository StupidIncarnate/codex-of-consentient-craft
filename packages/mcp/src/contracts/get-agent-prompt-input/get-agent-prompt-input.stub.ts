import type { StubArgument } from '@dungeonmaster/shared/@types';
import { getAgentPromptInputContract } from './get-agent-prompt-input-contract';
import type { GetAgentPromptInput } from './get-agent-prompt-input-contract';

export const GetAgentPromptInputStub = ({
  ...props
}: StubArgument<GetAgentPromptInput> = {}): GetAgentPromptInput =>
  getAgentPromptInputContract.parse({
    agent: 'quest-gap-reviewer',
    ...props,
  });
