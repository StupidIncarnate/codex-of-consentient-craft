/**
 * PURPOSE: Builds a valid WorkItemToPrompt for tests
 *
 * USAGE:
 * WorkItemToPromptStub();
 * // Returns a valid WorkItemToPrompt
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { AgentPromptResultStub } from '@dungeonmaster/shared/contracts/agent-prompt-result/agent-prompt-result.stub';

import { workItemToPromptContract } from './work-item-to-prompt-contract';
import type { WorkItemToPrompt } from './work-item-to-prompt-contract';

export const WorkItemToPromptStub = ({
  ...props
}: StubArgument<WorkItemToPrompt> = {}): WorkItemToPrompt =>
  workItemToPromptContract.parse({
    prompt: 'sample',
    model: AgentPromptResultStub().model,
    ...props,
  });
