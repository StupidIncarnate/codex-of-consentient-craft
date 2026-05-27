import { QuestIdStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import { orchestratorFindQuestBySessionIdAdapter } from './orchestrator-find-quest-by-session-id-adapter';
import { orchestratorFindQuestBySessionIdAdapterProxy } from './orchestrator-find-quest-by-session-id-adapter.proxy';

describe('orchestratorFindQuestBySessionIdAdapter', () => {
  describe('successful lookup', () => {
    it('VALID: {sessionId resolves to questId} => returns the questId', async () => {
      const proxy = orchestratorFindQuestBySessionIdAdapterProxy();
      const questId = QuestIdStub({ value: 'q-adapter-sess-1' });
      const sessionId = SessionIdStub({ value: 'session-adapter-001' });

      proxy.returns({ questId });

      const result = await orchestratorFindQuestBySessionIdAdapter({ sessionId });

      expect(result).toBe(questId);
    });

    it('EMPTY: {sessionId not owned by any quest} => returns null', async () => {
      const proxy = orchestratorFindQuestBySessionIdAdapterProxy();
      const sessionId = SessionIdStub({ value: 'session-adapter-002' });

      proxy.returns({ questId: null });

      const result = await orchestratorFindQuestBySessionIdAdapter({ sessionId });

      expect(result).toBe(null);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorFindQuestBySessionIdAdapterProxy();
      const sessionId = SessionIdStub({ value: 'session-adapter-003' });

      proxy.throws({ error: new Error('session lookup failed') });

      await expect(orchestratorFindQuestBySessionIdAdapter({ sessionId })).rejects.toThrow(
        /^session lookup failed$/u,
      );
    });
  });
});
