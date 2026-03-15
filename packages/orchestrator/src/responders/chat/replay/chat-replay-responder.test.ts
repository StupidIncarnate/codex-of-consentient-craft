import {
  ProcessIdStub,
  SessionIdStub,
  GuildIdStub,
  GuildConfigStub,
  GuildStub,
  FilePathStub,
  FileNameStub,
  QuestStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { ChatReplayResponderProxy } from './chat-replay-responder.proxy';

describe('ChatReplayResponder', () => {
  describe('history complete event', () => {
    it('VALID: {sessionId, guildId, chatProcessId} => emits chat-history-complete', async () => {
      const proxy = ChatReplayResponderProxy();
      const eventCapture = proxy.setupEventCapture();
      const sessionId = SessionIdStub({ value: 'session-abc' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'replay-test' });
      const guild = GuildStub({ id: guildId });

      proxy.setupGuild({
        config: GuildConfigStub({ guilds: [guild] }),
        homeDir: '/home/testuser',
      });
      proxy.setupMainSession({ content: '' });
      proxy.setupSubagentDirMissing();

      proxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath: FilePathStub({ value: '/home/testuser/.dungeonmaster' }),
        questsPath: FilePathStub({
          value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`,
        }),
      });
      proxy.setupQuestDirectories({ files: [] });

      await proxy.callResponder({ sessionId, guildId, chatProcessId });

      const events = eventCapture.getEmittedEvents();
      const completeEvent = events.find((e) => e.type === 'chat-history-complete');

      expect(completeEvent).toStrictEqual({
        type: 'chat-history-complete',
        processId: chatProcessId,
        payload: { chatProcessId, sessionId },
      });
    });
  });

  describe('quest session linking', () => {
    it('VALID: {sessionId with linked quest} => emits quest-session-linked', async () => {
      const proxy = ChatReplayResponderProxy();
      const eventCapture = proxy.setupEventCapture();
      const sessionId = SessionIdStub({ value: 'session-linked' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'replay-link' });
      const guild = GuildStub({ id: guildId });
      const quest = QuestStub({
        workItems: [WorkItemStub({ role: 'chaoswhisperer', sessionId, status: 'complete' })],
      });

      proxy.setupGuild({
        config: GuildConfigStub({ guilds: [guild] }),
        homeDir: '/home/testuser',
      });
      proxy.setupMainSession({ content: '' });
      proxy.setupSubagentDirMissing();

      const questsPath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`,
      });
      proxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath: FilePathStub({ value: '/home/testuser/.dungeonmaster' }),
        questsPath,
      });
      proxy.setupQuestDirectories({
        files: [FileNameStub({ value: quest.folder })],
      });
      proxy.setupQuestFilePath({
        result: FilePathStub({
          value: `${questsPath}/${quest.folder}/quest.json`,
        }),
      });
      proxy.setupQuestFile({
        questJson: JSON.stringify(quest),
      });

      await proxy.callResponder({ sessionId, guildId, chatProcessId });

      const events = eventCapture.getEmittedEvents();
      const linkEvent = events.find((e) => e.type === 'quest-session-linked');

      expect(linkEvent).toStrictEqual({
        type: 'quest-session-linked',
        processId: chatProcessId,
        payload: { questId: quest.id, chatProcessId },
      });
    });
  });

  describe('generated process id', () => {
    it('VALID: {no chatProcessId} => generates replay process id', async () => {
      const proxy = ChatReplayResponderProxy();
      const eventCapture = proxy.setupEventCapture();
      const sessionId = SessionIdStub({ value: 'session-gen' });
      const guildId = GuildIdStub();
      const guild = GuildStub({ id: guildId });

      proxy.setupGuild({
        config: GuildConfigStub({ guilds: [guild] }),
        homeDir: '/home/testuser',
      });
      proxy.setupMainSession({ content: '' });
      proxy.setupSubagentDirMissing();

      proxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath: FilePathStub({ value: '/home/testuser/.dungeonmaster' }),
        questsPath: FilePathStub({
          value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`,
        }),
      });
      proxy.setupQuestDirectories({ files: [] });

      await proxy.callResponder({ sessionId, guildId });

      const events = eventCapture.getEmittedEvents();
      const completeEvent = events.find((e) => e.type === 'chat-history-complete');

      expect(completeEvent?.processId).toBe('replay-f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });
  });
});
