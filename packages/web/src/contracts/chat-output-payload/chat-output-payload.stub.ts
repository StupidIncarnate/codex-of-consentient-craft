import type { StubArgument } from '@dungeonmaster/shared/@types';
import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts/quest-work-item-id/quest-work-item-id.stub';
import { SessionIdStub } from '@dungeonmaster/shared/contracts/session-id/session-id.stub';

import { chatOutputPayloadContract } from './chat-output-payload-contract';
import type { ChatOutputPayload } from './chat-output-payload-contract';

export const ChatOutputPayloadStub = ({
  ...props
}: StubArgument<ChatOutputPayload> = {}): ChatOutputPayload =>
  chatOutputPayloadContract.parse({
    chatProcessId: 'proc-12345',
    entries: [],
    sessionId: SessionIdStub(),
    questId: QuestIdStub(),
    workItemId: QuestWorkItemIdStub(),
    ...props,
  });
