import {
  AbsoluteFilePathStub,
  GuildIdStub,
  QuestIdStub,
  QuestStub,
  TimeoutMsStub,
} from '@dungeonmaster/shared/contracts';

import { QuestNotFoundError } from '../../../errors/quest-not-found/quest-not-found-error';
import { smoketestPollQuestUntilTerminalBroker } from './smoketest-poll-quest-until-terminal-broker';
import { smoketestPollQuestUntilTerminalBrokerProxy } from './smoketest-poll-quest-until-terminal-broker.proxy';

const QUEST_ID = QuestIdStub({ value: 'poll-broker-quest' });
const OTHER_QUEST_ID = QuestIdStub({ value: 'other-poll-quest' });
const QUEST_PATH = AbsoluteFilePathStub({
  value:
    '/home/testuser/.dungeonmaster/guilds/11111111-1111-1111-1111-111111111111/quests/poll-broker-quest',
});
const GUILD_ID = GuildIdStub({ value: '11111111-1111-1111-1111-111111111111' });

describe('smoketestPollQuestUntilTerminalBroker', () => {
  describe('race: quest already terminal before subscription', () => {
    it('VALID: {initial load returns complete status} => resolves immediately with the loaded quest', async () => {
      const proxy = smoketestPollQuestUntilTerminalBrokerProxy();
      const quest = QuestStub({ id: QUEST_ID, status: 'complete' });
      proxy.setupLoaded({ questPath: QUEST_PATH, guildId: GUILD_ID, quest });

      const result = await smoketestPollQuestUntilTerminalBroker({
        questId: QUEST_ID,
        timeoutMs: TimeoutMsStub({ value: 5_000 }),
        subscribe: proxy.subscribe,
        unsubscribe: proxy.unsubscribe,
      });

      expect(result).toStrictEqual(quest);
    });
  });

  describe('event-driven terminal', () => {
    it('VALID: {initial load in_progress, later quest-modified with complete} => resolves with the later quest', async () => {
      const proxy = smoketestPollQuestUntilTerminalBrokerProxy();
      const inProgress = QuestStub({ id: QUEST_ID, status: 'in_progress' });
      const terminal = QuestStub({ id: QUEST_ID, status: 'complete' });
      proxy.setupLoaded({ questPath: QUEST_PATH, guildId: GUILD_ID, quest: inProgress });
      proxy.setupLoaded({ questPath: QUEST_PATH, guildId: GUILD_ID, quest: terminal });

      const pending = smoketestPollQuestUntilTerminalBroker({
        questId: QUEST_ID,
        timeoutMs: TimeoutMsStub({ value: 5_000 }),
        subscribe: proxy.subscribe,
        unsubscribe: proxy.unsubscribe,
        pollIntervalMs: 10_000,
      });

      // Let the initial load settle without triggering resolve
      await Promise.resolve();
      await Promise.resolve();

      proxy.emitQuestModified({ questId: QUEST_ID });

      await expect(pending).resolves.toStrictEqual(terminal);
    });
  });

  describe('poll-driven terminal', () => {
    it('VALID: {initial load in_progress, subsequent poll returns complete} => resolves via the poll interval', async () => {
      const proxy = smoketestPollQuestUntilTerminalBrokerProxy();
      const inProgress = QuestStub({ id: QUEST_ID, status: 'in_progress' });
      const terminal = QuestStub({ id: QUEST_ID, status: 'complete' });
      proxy.setupLoaded({ questPath: QUEST_PATH, guildId: GUILD_ID, quest: inProgress });
      proxy.setupLoaded({ questPath: QUEST_PATH, guildId: GUILD_ID, quest: terminal });

      const result = await smoketestPollQuestUntilTerminalBroker({
        questId: QUEST_ID,
        timeoutMs: TimeoutMsStub({ value: 5_000 }),
        subscribe: proxy.subscribe,
        unsubscribe: proxy.unsubscribe,
        pollIntervalMs: 5,
      });

      expect(result).toStrictEqual(terminal);
    });
  });

  describe('ignores events for other quests', () => {
    it('VALID: {quest-modified event for a different questId} => does not resolve, eventually times out', async () => {
      const proxy = smoketestPollQuestUntilTerminalBrokerProxy();
      const inProgress = QuestStub({ id: QUEST_ID, status: 'in_progress' });
      proxy.setupLoaded({ questPath: QUEST_PATH, guildId: GUILD_ID, quest: inProgress });

      const pending = smoketestPollQuestUntilTerminalBroker({
        questId: QUEST_ID,
        timeoutMs: TimeoutMsStub({ value: 50 }),
        subscribe: proxy.subscribe,
        unsubscribe: proxy.unsubscribe,
      });

      await Promise.resolve();
      await Promise.resolve();

      // Fire an unrelated event — must NOT cause a load attempt or settle
      proxy.emitQuestModified({ questId: OTHER_QUEST_ID });

      await expect(pending).rejects.toThrow(/timed out after 50ms/u);
    });
  });

  describe('timeout', () => {
    it('ERROR: {quest never reaches terminal} => rejects with timeout message', async () => {
      const proxy = smoketestPollQuestUntilTerminalBrokerProxy();
      const inProgress = QuestStub({ id: QUEST_ID, status: 'in_progress' });
      proxy.setupLoaded({ questPath: QUEST_PATH, guildId: GUILD_ID, quest: inProgress });

      await expect(
        smoketestPollQuestUntilTerminalBroker({
          questId: QUEST_ID,
          timeoutMs: TimeoutMsStub({ value: 30 }),
          subscribe: proxy.subscribe,
          unsubscribe: proxy.unsubscribe,
        }),
      ).rejects.toThrow(/timed out after 30ms/u);
    });
  });

  describe('initial load failure', () => {
    it('ERROR: {initial quest load throws} => rejects with the error', async () => {
      const proxy = smoketestPollQuestUntilTerminalBrokerProxy();
      proxy.setupFindThrows({
        error: new QuestNotFoundError({ questId: 'poll-broker-quest' }),
      });

      await expect(
        smoketestPollQuestUntilTerminalBroker({
          questId: QUEST_ID,
          timeoutMs: TimeoutMsStub({ value: 5_000 }),
          subscribe: proxy.subscribe,
          unsubscribe: proxy.unsubscribe,
        }),
      ).rejects.toThrow(/not found in any guild/u);
    });
  });
});
