import { ProcessIdStub, QuestIdStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import { chatStreamEndedPayloadContract } from './chat-stream-ended-payload-contract';
import { ChatStreamEndedPayloadStub } from './chat-stream-ended-payload.stub';

describe('chatStreamEndedPayloadContract', () => {
  it('VALID: {reason only} => parses with no other fields populated', () => {
    expect(chatStreamEndedPayloadContract.parse({ reason: 'turn-ended' })).toStrictEqual({
      reason: 'turn-ended',
    });
  });

  it('VALID: {chatProcessId only} => parses', () => {
    const chatProcessId = ProcessIdStub({ value: 'replay-abc' });

    expect(
      chatStreamEndedPayloadContract.parse({ reason: 'history-replayed', chatProcessId }),
    ).toStrictEqual({
      reason: 'history-replayed',
      chatProcessId,
    });
  });

  it('VALID: {chatProcessId + sessionId} => parses chat-complete shape', () => {
    const chatProcessId = ProcessIdStub({ value: 'live-1' });
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

  it('INVALID: {no reason} => throws, so no emit site can ship an unlabelled stream end', () => {
    expect(() => {
      chatStreamEndedPayloadContract.parse({ questId: QuestIdStub({ value: 'q-1' }) });
    }).toThrow(/Required/u);
  });

  it('INVALID: {unknown reason} => throws', () => {
    expect(() => {
      chatStreamEndedPayloadContract.parse({ reason: 'chat-complete' });
    }).toThrow(/Invalid enum value/u);
  });

  it('VALID: {ChatStreamEndedPayloadStub} => round-trips', () => {
    const payload = ChatStreamEndedPayloadStub();

    expect(chatStreamEndedPayloadContract.parse(payload)).toStrictEqual(payload);
  });
});
