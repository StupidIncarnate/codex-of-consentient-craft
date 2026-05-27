import { QuestIdStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import { QuestFindBySessionIdResponderProxy } from './quest-find-by-session-id-responder.proxy';

describe('QuestFindBySessionIdResponder', () => {
  it('VALID: {broker returns questId} => responder returns same questId', async () => {
    const proxy = QuestFindBySessionIdResponderProxy();
    const questId = QuestIdStub({ value: 'q-sess-resp-1' });
    const sessionId = SessionIdStub({ value: 'session-resp-001' });

    proxy.setupBrokerReturns({ questId });

    const result = await proxy.callResponder({ sessionId });

    expect(result).toBe(questId);
  });

  it('EMPTY: {broker returns null} => responder returns null', async () => {
    const proxy = QuestFindBySessionIdResponderProxy();
    const sessionId = SessionIdStub({ value: 'session-resp-002' });

    proxy.setupBrokerReturns({ questId: null });

    const result = await proxy.callResponder({ sessionId });

    expect(result).toBe(null);
  });
});
