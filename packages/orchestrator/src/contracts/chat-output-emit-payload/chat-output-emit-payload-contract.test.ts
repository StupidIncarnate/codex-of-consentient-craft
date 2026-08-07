import {
  ChatEntryStub,
  ProcessIdStub,
  QuestIdStub,
  QuestWorkItemIdStub,
  SessionIdStub,
  SlotIndexStub,
} from '@dungeonmaster/shared/contracts';

import { chatOutputEmitPayloadContract } from './chat-output-emit-payload-contract';
import { ChatOutputEmitPayloadStub } from './chat-output-emit-payload.stub';

describe('chatOutputEmitPayloadContract', () => {
  it('VALID: {full payload with sessionId + chatProcessId} => parses', () => {
    const processId = ProcessIdStub({ value: 'proc-queue-aaaaaaaa-1111-4222-9333-444444444444' });
    const slotIndex = SlotIndexStub({ value: 0 });
    const entries = [ChatEntryStub({ role: 'assistant', type: 'text', content: 'hello' })];
    const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
    const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' });
    const sessionId = SessionIdStub({ value: 'b4a5c2d1-918c-4408-aeb1-f8f4ce8400cb' });
    const chatProcessId = ProcessIdStub({ value: 'b4a5c2d1-918c-4408-aeb1-f8f4ce8400cb' });

    const parsed = chatOutputEmitPayloadContract.parse({
      processId,
      slotIndex,
      entries,
      questId,
      workItemId,
      sessionId,
      chatProcessId,
    });

    expect(parsed).toStrictEqual({
      processId,
      slotIndex,
      entries,
      questId,
      workItemId,
      sessionId,
      chatProcessId,
    });
  });

  it('VALID: {minimal payload, no sessionId, no chatProcessId} => parses', () => {
    const processId = ProcessIdStub({ value: 'proc-queue-aaaaaaaa-1111-4222-9333-444444444444' });
    const slotIndex = SlotIndexStub({ value: 0 });
    const entries = [ChatEntryStub({ role: 'assistant', type: 'text', content: 'hello' })];
    const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
    const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' });

    const parsed = chatOutputEmitPayloadContract.parse({
      processId,
      slotIndex,
      entries,
      questId,
      workItemId,
    });

    expect(parsed).toStrictEqual({ processId, slotIndex, entries, questId, workItemId });
  });

  it('INVALID: {missing questId} => throws Required error', () => {
    const processId = ProcessIdStub({ value: 'proc-queue-aaaaaaaa-1111-4222-9333-444444444444' });
    const slotIndex = SlotIndexStub({ value: 0 });
    const entries = [ChatEntryStub({ role: 'assistant', type: 'text', content: 'hello' })];
    const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' });

    expect(() =>
      chatOutputEmitPayloadContract.parse({ processId, slotIndex, entries, workItemId }),
    ).toThrow(/Required/u);
  });

  it('INVALID: {missing workItemId} => throws Required error', () => {
    const processId = ProcessIdStub({ value: 'proc-queue-aaaaaaaa-1111-4222-9333-444444444444' });
    const slotIndex = SlotIndexStub({ value: 0 });
    const entries = [ChatEntryStub({ role: 'assistant', type: 'text', content: 'hello' })];
    const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });

    expect(() =>
      chatOutputEmitPayloadContract.parse({ processId, slotIndex, entries, questId }),
    ).toThrow(/Required/u);
  });

  it('VALID: {stub defaults} => parses to the stub payload', () => {
    const entries = [ChatEntryStub({ role: 'assistant', type: 'text', content: 'stub entry' })];

    const parsed = chatOutputEmitPayloadContract.parse(ChatOutputEmitPayloadStub({ entries }));

    expect(parsed).toStrictEqual({
      processId: ProcessIdStub({ value: 'proc-queue-aaaaaaaa-1111-4222-9333-444444444444' }),
      slotIndex: SlotIndexStub({ value: 0 }),
      entries,
      questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
      workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' }),
    });
  });
});
