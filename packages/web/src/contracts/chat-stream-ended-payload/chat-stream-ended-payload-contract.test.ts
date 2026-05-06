import { ProcessIdStub, QuestIdStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import { chatStreamEndedPayloadContract } from './chat-stream-ended-payload-contract';
import { ChatStreamEndedPayloadStub } from './chat-stream-ended-payload.stub';

describe('chatStreamEndedPayloadContract', () => {
  it('VALID: {empty} => parses with no fields populated', () => {
    expect(chatStreamEndedPayloadContract.parse({})).toStrictEqual({});
  });

  it('VALID: {chatProcessId only} => parses', () => {
    const chatProcessId = ProcessIdStub({ value: 'replay-abc' });

    expect(chatStreamEndedPayloadContract.parse({ chatProcessId })).toStrictEqual({
      chatProcessId,
    });
  });

  it('VALID: {chatProcessId + sessionId} => parses chat-complete shape', () => {
    const chatProcessId = ProcessIdStub({ value: 'live-1' });
    const sessionId = SessionIdStub({ value: 'sess-1' });

    expect(chatStreamEndedPayloadContract.parse({ chatProcessId, sessionId })).toStrictEqual({
      chatProcessId,
      sessionId,
    });
  });

  it('VALID: {questId only} => parses chat-history-complete shape', () => {
    const questId = QuestIdStub({ value: 'q-1' });

    expect(chatStreamEndedPayloadContract.parse({ questId })).toStrictEqual({ questId });
  });

  it('VALID: {ChatStreamEndedPayloadStub} => round-trips', () => {
    const payload = ChatStreamEndedPayloadStub();

    expect(chatStreamEndedPayloadContract.parse(payload)).toStrictEqual(payload);
  });
});
