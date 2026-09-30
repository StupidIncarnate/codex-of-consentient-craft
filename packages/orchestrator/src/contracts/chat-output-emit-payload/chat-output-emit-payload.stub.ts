import type { StubArgument } from '@dungeonmaster/shared/@types';
import { ChatEntryStub } from '@dungeonmaster/shared/contracts/chat-entry/chat-entry.stub';
import { ProcessIdStub } from '@dungeonmaster/shared/contracts/process-id/process-id.stub';
import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts/quest-work-item-id/quest-work-item-id.stub';

import {
  chatOutputEmitPayloadContract,
  type ChatOutputEmitPayload,
} from './chat-output-emit-payload-contract';

export const ChatOutputEmitPayloadStub = ({
  ...props
}: StubArgument<ChatOutputEmitPayload> = {}): ChatOutputEmitPayload =>
  chatOutputEmitPayloadContract.parse({
    processId: ProcessIdStub({ value: 'proc-queue-aaaaaaaa-1111-4222-9333-444444444444' }),
    slotIndex: 0,
    entries: [ChatEntryStub({ role: 'assistant', type: 'text', content: 'stub entry' })],
    questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
    workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' }),
    ...props,
  });
