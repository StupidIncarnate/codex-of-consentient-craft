import type { StubArgument } from '@dungeonmaster/shared/@types';
import {
  ProcessIdStub,
  QuestIdStub,
  QuestWorkItemIdStub,
  SessionIdStub,
} from '@dungeonmaster/shared/contracts';

import { chatOutputPayloadContract } from './chat-output-payload-contract';
import type { ChatOutputPayload } from './chat-output-payload-contract';

export const ChatOutputPayloadStub = ({
  ...props
}: StubArgument<ChatOutputPayload> = {}): ChatOutputPayload =>
  chatOutputPayloadContract.parse({
    chatProcessId: ProcessIdStub(),
    entries: [],
    sessionId: SessionIdStub(),
    questId: QuestIdStub(),
    workItemId: QuestWorkItemIdStub(),
    ...props,
  });
