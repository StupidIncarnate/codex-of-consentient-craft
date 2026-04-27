import type { StubArgument } from '@dungeonmaster/shared/@types';
import {
  ChatEntryStub,
  ProcessIdStub,
  QuestIdStub,
  QuestWorkItemIdStub,
} from '@dungeonmaster/shared/contracts';

import { SlotIndexStub } from '../slot-index/slot-index.stub';
import {
  chatOutputEmitPayloadContract,
  type ChatOutputEmitPayload,
} from './chat-output-emit-payload-contract';

export const ChatOutputEmitPayloadStub = ({
  ...props
}: StubArgument<ChatOutputEmitPayload> = {}): ChatOutputEmitPayload =>
  chatOutputEmitPayloadContract.parse({
    processId: ProcessIdStub({ value: 'proc-queue-aaaaaaaa-1111-4222-9333-444444444444' }),
    slotIndex: SlotIndexStub({ value: 0 }),
    entries: [ChatEntryStub({ role: 'assistant', type: 'text', content: 'stub entry' })],
    questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
    workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' }),
    ...props,
  });
