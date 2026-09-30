import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { SessionIdStub } from '@dungeonmaster/shared/contracts/session-id/session-id.stub';

import { chatStreamEndedPayloadContract } from './chat-stream-ended-payload-contract';
import { ChatStreamEndedPayloadStub } from './chat-stream-ended-payload.stub';

describe('chatStreamEndedPayloadContract', () => {
  it('VALID: {reason only} => parses with no other fields populated', () => {
    expect(chatStreamEndedPayloadContract.parse({ reason: 'turn-ended' })).toStrictEqual({
      reason: 'turn-ended',
    });
  });

  it('VALID: {chatProcessId only} => parses', () => {
    const chatProcessId = 'replay-abc';

    expect(
      chatStreamEndedPayloadContract.parse({ reason: 'history-replayed', chatProcessId }),
    ).toStrictEqual({
      reason: 'history-replayed',
      chatProcessId,
    });
  });

  it('VALID: {chatProcessId + sessionId} => parses chat-complete shape', () => {
    const chatProcessId = 'live-1';
    const sessionId = SessionIdStub({ value: 'sess-1' });

    expect(
      chatStreamEndedPayloadContract.parse({ reason: 'turn-ended', chatProcessId, sessionId }),
    ).toStrictEqual({
      reason: 'turn-ended',
      chatProcessId,
      sessionId,
    });
  });

  it('VALID: {questId only} => parses chat-history-complete shape', () => {
    const questId = QuestIdStub({ value: 'q-1' });

    expect(
      chatStreamEndedPayloadContract.parse({ reason: 'history-replayed', questId }),
    ).toStrictEqual({ reason: 'history-replayed', questId });
  });

  it('VALID: {turn-ended + retained} => parses the subscribe-time re-delivery of a finished turn', () => {
    const chatProcessId = 'chat-first-message';

    expect(
      chatStreamEndedPayloadContract.parse({
        reason: 'turn-ended',
        chatProcessId,
        retained: true,
      }),
    ).toStrictEqual({ reason: 'turn-ended', chatProcessId, retained: true });
  });

  it('INVALID: {no reason} => throws, so no emit site can ship an unlabelled stream end', () => {
    expect(() => {
      chatStreamEndedPayloadContract.parse({ questId: QuestIdStub({ value: 'q-1' }) });
    }).toThrow(/Invalid option/u);
  });

  it('INVALID: {unknown reason} => throws', () => {
    expect(() => {
      chatStreamEndedPayloadContract.parse({ reason: 'chat-complete' });
    }).toThrow(/Invalid option/u);
  });

  it('VALID: {ChatStreamEndedPayloadStub} => round-trips', () => {
    const payload = ChatStreamEndedPayloadStub();

    expect(chatStreamEndedPayloadContract.parse(payload)).toStrictEqual(payload);
  });
});
