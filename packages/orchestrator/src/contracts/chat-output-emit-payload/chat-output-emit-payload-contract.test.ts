import {
  ChatEntryStub,
  ProcessIdStub,
  QuestIdStub,
  QuestWorkItemIdStub,
  SessionIdStub,
} from '@dungeonmaster/shared/contracts';

import { SlotIndexStub } from '../slot-index/slot-index.stub';
import { chatOutputEmitPayloadContract } from './chat-output-emit-payload-contract';

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
});
