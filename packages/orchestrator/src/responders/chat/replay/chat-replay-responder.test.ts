import {
  AgentIdStub,
  ProcessIdStub,
  QuestWorkItemIdStub,
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

  describe('linked quest stamps payloads with questId + workItemId', () => {
    it('VALID: {sessionId on a linked quest workItem} => chat-history-complete carries questId+workItemId', async () => {
      const proxy = ChatReplayResponderProxy();
      const eventCapture = proxy.setupEventCapture();
      const sessionId = SessionIdStub({ value: 'session-stamped' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'replay-stamp' });
      const guild = GuildStub({ id: guildId });
      const linkedWorkItem = WorkItemStub({
        role: 'chaoswhisperer',
        sessionId,
        status: 'complete',
      });
      const quest = QuestStub({ workItems: [linkedWorkItem] });

      // Quest lookup runs FIRST in the responder. Underlying fs/path mocks are sequential
      // queues, so set up mocks in the order the responder consumes them: questList first,
      // then chatHistoryReplay (guildGet + JSONL + subagent dir).
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

      proxy.setupGuild({
        config: GuildConfigStub({ guilds: [guild] }),
        homeDir: '/home/testuser',
      });
      proxy.setupMainSession({ content: '' });
      proxy.setupSubagentDirMissing();

      await proxy.callResponder({ sessionId, guildId, chatProcessId });

      const events = eventCapture.getEmittedEvents();
      const completeEvent = events.find((e) => e.type === 'chat-history-complete');

      expect(completeEvent).toStrictEqual({
        type: 'chat-history-complete',
        processId: chatProcessId,
        payload: {
          chatProcessId,
          sessionId,
          questId: quest.id,
          workItemId: linkedWorkItem.id,
        },
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
      const linkedWorkItem = WorkItemStub({
        role: 'chaoswhisperer',
        sessionId,
        status: 'complete',
      });
      const quest = QuestStub({ workItems: [linkedWorkItem] });

      // Quest lookup runs FIRST in the responder. Mocks consumed in setup order.
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

      proxy.setupGuild({
        config: GuildConfigStub({ guilds: [guild] }),
        homeDir: '/home/testuser',
      });
      proxy.setupMainSession({ content: '' });
      proxy.setupSubagentDirMissing();

      await proxy.callResponder({ sessionId, guildId, chatProcessId });

      const events = eventCapture.getEmittedEvents();
      const linkEvent = events.find((e) => e.type === 'quest-session-linked');

      expect(linkEvent).toStrictEqual({
        type: 'quest-session-linked',
        processId: chatProcessId,
        payload: {
          questId: quest.id,
          chatProcessId,
          workItemId: linkedWorkItem.id,
          role: 'chaoswhisperer',
        },
      });
    });
  });

  describe('agentId-scoped lookup', () => {
    it('VALID: {agentId param + two workItems sharing sessionId} => links to the workItem whose agentId matches', async () => {
      const proxy = ChatReplayResponderProxy();
      const eventCapture = proxy.setupEventCapture();
      const sessionId = SessionIdStub({ value: '18eb0c1b-5b9e-4ff0-aaea-9f9fe0bb6402' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'replay-agent-scope' });
      const guild = GuildStub({ id: guildId });

      // Two pathseeker-surface work items under the same /dumpster-launch parent
      // session — they share sessionId. The agentId param is what disambiguates them.
      const matchingAgentId = AgentIdStub({ value: 'acd35f7b7763e33e8' });
      const otherAgentId = AgentIdStub({ value: 'bbb000000other000' });
      const matchingWorkItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: '875c3364-2d64-4606-b9e3-25dd365c7792' }),
        role: 'pathseeker-surface',
        sessionId,
        agentId: matchingAgentId,
      });
      const otherWorkItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'cccccccc-2d64-4606-b9e3-25dd365c7792' }),
        role: 'pathseeker-surface',
        sessionId,
        agentId: otherAgentId,
      });
      const quest = QuestStub({ workItems: [otherWorkItem, matchingWorkItem] });

      const questsPath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`,
      });
      proxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath: FilePathStub({ value: '/home/testuser/.dungeonmaster' }),
        questsPath,
      });
      proxy.setupQuestDirectories({ files: [FileNameStub({ value: quest.folder })] });
      proxy.setupQuestFilePath({
        result: FilePathStub({ value: `${questsPath}/${quest.folder}/quest.json` }),
      });
      proxy.setupQuestFile({ questJson: JSON.stringify(quest) });

      proxy.setupGuild({
        config: GuildConfigStub({ guilds: [guild] }),
        homeDir: '/home/testuser',
      });
      proxy.setupMainSession({ content: '' });
      proxy.setupSubagentDirMissing();

      await proxy.callResponder({ sessionId, agentId: matchingAgentId, guildId, chatProcessId });

      const events = eventCapture.getEmittedEvents();
      const linkEvent = events.find((e) => e.type === 'quest-session-linked');

      expect(linkEvent).toStrictEqual({
        type: 'quest-session-linked',
        processId: chatProcessId,
        payload: {
          questId: quest.id,
          chatProcessId,
          // The agentId filter must steer the lookup to matchingWorkItem (not otherWorkItem
          // even though both have the same sessionId).
          workItemId: matchingWorkItem.id,
          role: 'pathseeker-surface',
        },
      });
    });
  });

  describe('orphan session (no linked quest)', () => {
    it('EDGE: {sessionId not linked to any quest workItem} => chat-output payload omits questId and workItemId', async () => {
      const proxy = ChatReplayResponderProxy();
      const eventCapture = proxy.setupEventCapture();
      const sessionId = SessionIdStub({ value: 'session-orphan' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'replay-orphan' });
      const guild = GuildStub({ id: guildId });

      // Quest list comes back EMPTY — sessionId belongs to no quest workItem.
      proxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath: FilePathStub({ value: '/home/testuser/.dungeonmaster' }),
        questsPath: FilePathStub({
          value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`,
        }),
      });
      proxy.setupQuestDirectories({ files: [] });

      proxy.setupGuild({
        config: GuildConfigStub({ guilds: [guild] }),
        homeDir: '/home/testuser',
      });
      // Non-empty main session JSONL so chatHistoryReplayBroker invokes onEntries and
      // a chat-output frame is emitted.
      proxy.setupMainSession({
        content:
          '{"type":"assistant","timestamp":"2025-01-01T00:00:01Z","message":{"content":[{"type":"text","text":"orphan reply"}]}}',
      });
      proxy.setupSubagentDirMissing();

      await proxy.callResponder({ sessionId, guildId, chatProcessId });

      const events = eventCapture.getEmittedEvents();
      const chatOutputPayloadKeys = events
        .filter((e) => e.type === 'chat-output')
        .map((e) => Object.keys(e.payload).sort());

      // Exactly one chat-output frame fired for this orphan session — and its payload
      // keys must NOT include questId or workItemId (those only get stamped when the
      // session is linked to a quest workItem). sessionId is always present so the
      // SessionViewWidget readonly viewer can bucket entries per-session.
      expect(chatOutputPayloadKeys).toStrictEqual([['chatProcessId', 'entries', 'sessionId']]);
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
