import { questSessionPersistBroker } from './quest-session-persist-broker';
import { questSessionPersistBrokerProxy } from './quest-session-persist-broker.proxy';
import { QuestStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

type SessionId = ReturnType<typeof SessionIdStub>;

describe('questSessionPersistBroker', () => {
  describe('successful persist', () => {
    it('VALID: {questId, sessionId, no existing sessions} => calls modify with new active session', async () => {
      const proxy = questSessionPersistBrokerProxy();
      const sessionId: SessionId = SessionIdStub({ value: 'test-session-id-123' });
      const quest = QuestStub({ id: 'quest-1', chatSessions: [] });

      proxy.setupQuestFound({
        result: { success: true, quest } as never,
      });
      proxy.setupModifyReturns({ result: { success: true } as never });

      await questSessionPersistBroker({ questId: 'quest-1', sessionId });

      const callArgs = proxy.getModifyCallArgs();

      expect(callArgs).toStrictEqual([
        {
          questId: 'quest-1',
          input: {
            questId: 'quest-1',
            chatSessions: [
              {
                sessionId: 'test-session-id-123',
                agentRole: 'chaoswhisperer',
                startedAt: '2026-02-14T00:00:00.000Z',
                active: true,
              },
            ],
          },
        },
      ]);
    });

    it('VALID: {questId with existing active session} => deactivates previous and adds new', async () => {
      const proxy = questSessionPersistBrokerProxy();
      const sessionId: SessionId = SessionIdStub({ value: 'new-session-456' });
      const quest = QuestStub({
        id: 'quest-2',
        chatSessions: [
          {
            sessionId: 'old-session-789',
            agentRole: 'chaoswhisperer',
            startedAt: '2026-01-01T00:00:00.000Z',
            active: true,
          },
        ],
      });

      proxy.setupQuestFound({
        result: { success: true, quest } as never,
      });
      proxy.setupModifyReturns({ result: { success: true } as never });

      await questSessionPersistBroker({ questId: 'quest-2', sessionId });

      const callArgs = proxy.getModifyCallArgs();

      expect(callArgs).toStrictEqual([
        {
          questId: 'quest-2',
          input: {
            questId: 'quest-2',
            chatSessions: [
              {
                sessionId: 'old-session-789',
                agentRole: 'chaoswhisperer',
                startedAt: '2026-01-01T00:00:00.000Z',
                active: false,
              },
              {
                sessionId: 'new-session-456',
                agentRole: 'chaoswhisperer',
                startedAt: '2026-02-14T00:00:00.000Z',
                active: true,
              },
            ],
          },
        },
      ]);
    });
  });

  describe('quest not found', () => {
    it('ERROR: {nonexistent questId} => does not call modify', async () => {
      const proxy = questSessionPersistBrokerProxy();
      const sessionId: SessionId = SessionIdStub({ value: 'test-session-id-123' });

      proxy.setupQuestNotFound();

      await questSessionPersistBroker({ questId: 'missing-quest', sessionId });

      const callArgs = proxy.getModifyCallArgs();

      expect(callArgs).toStrictEqual([]);
    });
  });

  describe('adapter throws', () => {
    it('ERROR: {get quest throws} => catches error without throwing', async () => {
      const proxy = questSessionPersistBrokerProxy();
      const sessionId: SessionId = SessionIdStub({ value: 'test-session-id-123' });

      proxy.setupGetQuestThrows({ error: new Error('Network error') });

      await expect(
        questSessionPersistBroker({ questId: 'quest-1', sessionId }),
      ).resolves.toBeUndefined();
    });
  });
});
