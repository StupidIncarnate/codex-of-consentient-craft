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

  describe('with summary', () => {
    it('VALID: {new session with summary} => includes summary in new session entry', async () => {
      const proxy = questSessionPersistBrokerProxy();
      const sessionId: SessionId = SessionIdStub({ value: 'summary-session-123' });
      const quest = QuestStub({ id: 'quest-1', chatSessions: [] });

      proxy.setupQuestFound({
        result: { success: true, quest } as never,
      });
      proxy.setupModifyReturns({ result: { success: true } as never });

      await questSessionPersistBroker({
        questId: 'quest-1',
        sessionId,
        summary: 'Built login page',
      });

      const callArgs = proxy.getModifyCallArgs();

      expect(callArgs).toStrictEqual([
        {
          questId: 'quest-1',
          input: {
            questId: 'quest-1',
            chatSessions: [
              {
                sessionId: 'summary-session-123',
                agentRole: 'chaoswhisperer',
                startedAt: '2026-02-14T00:00:00.000Z',
                active: true,
                summary: 'Built login page',
              },
            ],
          },
        },
      ]);
    });

    it('VALID: {existing session with summary} => includes summary on matching session', async () => {
      const proxy = questSessionPersistBrokerProxy();
      const sessionId: SessionId = SessionIdStub({ value: 'existing-summary-123' });
      const quest = QuestStub({
        id: 'quest-1',
        chatSessions: [
          {
            sessionId: 'existing-summary-123',
            agentRole: 'chaoswhisperer',
            startedAt: '2026-01-01T00:00:00.000Z',
            active: false,
          },
        ],
      });

      proxy.setupQuestFound({
        result: { success: true, quest } as never,
      });
      proxy.setupModifyReturns({ result: { success: true } as never });

      await questSessionPersistBroker({ questId: 'quest-1', sessionId, summary: 'Fixed auth bug' });

      const callArgs = proxy.getModifyCallArgs();

      expect(callArgs).toStrictEqual([
        {
          questId: 'quest-1',
          input: {
            questId: 'quest-1',
            chatSessions: [
              {
                sessionId: 'existing-summary-123',
                agentRole: 'chaoswhisperer',
                startedAt: '2026-02-14T00:00:00.000Z',
                active: true,
                summary: 'Fixed auth bug',
              },
            ],
          },
        },
      ]);
    });
  });

  describe('duplicate sessionId', () => {
    it('VALID: {questId with same sessionId already exists} => updates existing instead of duplicating', async () => {
      const proxy = questSessionPersistBrokerProxy();
      const sessionId: SessionId = SessionIdStub({ value: 'same-session-123' });
      const quest = QuestStub({
        id: 'quest-1',
        chatSessions: [
          {
            sessionId: 'same-session-123',
            agentRole: 'chaoswhisperer',
            startedAt: '2026-01-01T00:00:00.000Z',
            active: false,
          },
        ],
      });

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
                sessionId: 'same-session-123',
                agentRole: 'chaoswhisperer',
                startedAt: '2026-02-14T00:00:00.000Z',
                active: true,
              },
            ],
          },
        },
      ]);
    });

    it('VALID: {questId with same sessionId among others} => updates matching, deactivates rest, no duplicates', async () => {
      const proxy = questSessionPersistBrokerProxy();
      const sessionId: SessionId = SessionIdStub({ value: 'same-session-123' });
      const quest = QuestStub({
        id: 'quest-2',
        chatSessions: [
          {
            sessionId: 'other-session-000',
            agentRole: 'chaoswhisperer',
            startedAt: '2025-12-01T00:00:00.000Z',
            active: false,
          },
          {
            sessionId: 'same-session-123',
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
                sessionId: 'other-session-000',
                agentRole: 'chaoswhisperer',
                startedAt: '2025-12-01T00:00:00.000Z',
                active: false,
              },
              {
                sessionId: 'same-session-123',
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
