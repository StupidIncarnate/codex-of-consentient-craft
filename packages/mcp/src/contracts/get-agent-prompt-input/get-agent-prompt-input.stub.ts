import type { StubArgument } from '@dungeonmaster/shared/@types';
import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts/quest-work-item-id/quest-work-item-id.stub';

import { getAgentPromptInputContract } from './get-agent-prompt-input-contract';
import type { GetAgentPromptInput } from './get-agent-prompt-input-contract';

export const GetAgentPromptInputStub = ({
  ...props
}: StubArgument<GetAgentPromptInput> = {}): GetAgentPromptInput =>
  getAgentPromptInputContract.parse({
    agent: 'chaoswhisperer-gap-minion',
    questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
    workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' }),
    ...props,
  });
