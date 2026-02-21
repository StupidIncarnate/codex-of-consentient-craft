import { sessionResolveOwnerBroker } from './session-resolve-owner-broker';
import { sessionResolveOwnerBrokerProxy } from './session-resolve-owner-broker.proxy';
import {
  GuildStub,
  GuildIdStub,
  SessionIdStub,
  QuestListItemStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

type GuildId = ReturnType<typeof GuildIdStub>;
type SessionId = ReturnType<typeof SessionIdStub>;

describe('sessionResolveOwnerBroker', () => {
  describe('guild-level session', () => {
    it('VALID: {session found on guild} => returns questId null', async () => {
      const proxy = sessionResolveOwnerBrokerProxy();
      const sessionId: SessionId = SessionIdStub({ value: 'guild-session-001' });
      const guildId: GuildId = GuildIdStub();
      const guild = GuildStub({
        chatSessions: [
          {
            sessionId: 'guild-session-001',
            agentRole: 'chaoswhisperer',
            startedAt: '2024-01-15T10:00:00.000Z',
            active: true,
          },
        ],
      });

      proxy.setupGuild({ guild });

      const result = await sessionResolveOwnerBroker({ guildId, sessionId });

      expect(result).toStrictEqual({ questId: null });
    });
  });

  describe('quest-level session', () => {
    it('VALID: {session found on quest} => returns questId and quest', async () => {
      const proxy = sessionResolveOwnerBrokerProxy();
      const sessionId: SessionId = SessionIdStub({ value: 'quest-session-001' });
      const guildId: GuildId = GuildIdStub();
      const guild = GuildStub({ chatSessions: [] });
      const quest = QuestStub({
        id: 'my-quest',
        chatSessions: [
          {
            sessionId: 'quest-session-001',
            agentRole: 'chaoswhisperer',
            startedAt: '2024-01-15T10:00:00.000Z',
            active: true,
          },
        ],
      });

      proxy.setupGuild({ guild });
      proxy.setupQuestList({
        quests: [QuestListItemStub({ id: 'my-quest' })],
      });
      proxy.setupGetQuest({ result: { success: true, quest } as never });

      const result = await sessionResolveOwnerBroker({ guildId, sessionId });

      expect(result.questId).toBe('my-quest');
      expect(result.quest).toStrictEqual(quest);
    });
  });

  describe('session not found', () => {
    it('EMPTY: {session not on guild or quests} => returns questId null', async () => {
      const proxy = sessionResolveOwnerBrokerProxy();
      const sessionId: SessionId = SessionIdStub({ value: 'nonexistent-session' });
      const guildId: GuildId = GuildIdStub();
      const guild = GuildStub({ chatSessions: [] });
      const quest = QuestStub({
        id: 'my-quest',
        chatSessions: [],
      });

      proxy.setupGuild({ guild });
      proxy.setupQuestList({
        quests: [QuestListItemStub({ id: 'my-quest' })],
      });
      proxy.setupGetQuest({ result: { success: true, quest } as never });

      const result = await sessionResolveOwnerBroker({ guildId, sessionId });

      expect(result).toStrictEqual({ questId: null });
    });
  });

  describe('no quests in guild', () => {
    it('EMPTY: {guild has no quests} => returns questId null', async () => {
      const proxy = sessionResolveOwnerBrokerProxy();
      const sessionId: SessionId = SessionIdStub({ value: 'orphan-session' });
      const guildId: GuildId = GuildIdStub();
      const guild = GuildStub({ chatSessions: [] });

      proxy.setupGuild({ guild });
      proxy.setupQuestList({ quests: [] });

      const result = await sessionResolveOwnerBroker({ guildId, sessionId });

      expect(result).toStrictEqual({ questId: null });
    });
  });

  describe('adapter error', () => {
    it('ERROR: {get guild throws} => propagates error', async () => {
      const proxy = sessionResolveOwnerBrokerProxy();
      const sessionId: SessionId = SessionIdStub({ value: 'test-session' });
      const guildId: GuildId = GuildIdStub();

      proxy.setupGetGuildThrows({ error: new Error('Guild not found') });

      await expect(sessionResolveOwnerBroker({ guildId, sessionId })).rejects.toThrow(
        /Guild not found/u,
      );
    });
  });
});
