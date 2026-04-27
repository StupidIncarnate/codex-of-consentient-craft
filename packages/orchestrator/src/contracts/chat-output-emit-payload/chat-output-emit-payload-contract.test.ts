import { ChatEntryStub, ProcessIdStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import { SlotIndexStub } from '../slot-index/slot-index.stub';
import { chatOutputEmitPayloadContract } from './chat-output-emit-payload-contract';

describe('chatOutputEmitPayloadContract', () => {
  it('VALID: {full payload with sessionId + chatProcessId} => parses', () => {
    const processId = ProcessIdStub({ value: 'proc-queue-aaaaaaaa-1111-4222-9333-444444444444' });
    const slotIndex = SlotIndexStub({ value: 0 });
    const entries = [ChatEntryStub({ role: 'assistant', type: 'text', content: 'hello' })];
    const sessionId = SessionIdStub({ value: 'b4a5c2d1-918c-4408-aeb1-f8f4ce8400cb' });
    const chatProcessId = ProcessIdStub({ value: 'b4a5c2d1-918c-4408-aeb1-f8f4ce8400cb' });

    const parsed = chatOutputEmitPayloadContract.parse({
      processId,
      slotIndex,
      entries,
      sessionId,
      chatProcessId,
    });

    expect(parsed).toStrictEqual({
      processId,
      slotIndex,
      entries,
      sessionId,
      chatProcessId,
    });
  });

  it('VALID: {minimal payload, no sessionId, no chatProcessId} => parses', () => {
    const processId = ProcessIdStub({ value: 'proc-queue-aaaaaaaa-1111-4222-9333-444444444444' });
    const slotIndex = SlotIndexStub({ value: 0 });
    const entries = [ChatEntryStub({ role: 'assistant', type: 'text', content: 'hello' })];

    const parsed = chatOutputEmitPayloadContract.parse({ processId, slotIndex, entries });

    expect(parsed).toStrictEqual({ processId, slotIndex, entries });
  });
});
