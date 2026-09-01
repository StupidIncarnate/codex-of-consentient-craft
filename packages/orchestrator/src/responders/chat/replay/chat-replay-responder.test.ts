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

import type { chatHistoryReplayBroker } from '../../../brokers/chat/history-replay/chat-history-replay-broker';
import { ChatReplayResponderProxy } from './chat-replay-responder.proxy';

// Derived from chatHistoryReplayBroker's own onEntries parameter type (never imported from
// contracts) so the pasted-image cases below can narrow a captured chat-output payload's
// entries to the 'user' variant and assert its `content` field directly, instead of comparing
// the whole entries array. setupEventCapture's payload is a generic Record<PropertyKey,
// unknown> shared across three different event types (test files may not import contracts, so
// there is no schema to parse it through), so bridging its `entries` field into this shape
// needs one assertion at that boundary — external, uncertain data, the same class as
// JSON.parse. The union-to-variant narrow below it uses a type predicate instead of a second
// cast.
type ChatOutputEntries = Parameters<
  Parameters<typeof chatHistoryReplayBroker>[0]['onEntries']
>[0]['entries'];
type ChatOutputEntry = ChatOutputEntries[0];
type ChatOutputUserEntry = Extract<ChatOutputEntry, { role: 'user' }>;

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
        sessionId,
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
        sessionId,
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
        sessionId,
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

      // Two codeweaver work items under the same /dumpster-launch parent
      // session — they share sessionId. The agentId param is what disambiguates them.
      const matchingAgentId = AgentIdStub({ value: 'acd35f7b7763e33e8' });
      const otherAgentId = AgentIdStub({ value: 'bbb000000other000' });
      const matchingWorkItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: '875c3364-2d64-4606-b9e3-25dd365c7792' }),
        role: 'codeweaver',
        sessionId,
        agentId: matchingAgentId,
      });
      const otherWorkItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'cccccccc-2d64-4606-b9e3-25dd365c7792' }),
        role: 'codeweaver',
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
        sessionId,
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
          role: 'codeweaver',
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
        sessionId,
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
      // SessionViewWidget readonly viewer can bucket entries per-session, and `replay`
      // marks the frame as a transcript read off disk rather than an agent emitting.
      expect(chatOutputPayloadKeys).toStrictEqual([
        ['chatProcessId', 'entries', 'replay', 'sessionId'],
      ]);
    });
  });

  describe('pasted-image path rewriting', () => {
    it('VALID: {session linked to a quest, main session user line carries a pasted-image token} => chat-output payload entry content is the rewritten /api/images URL', async () => {
      const proxy = ChatReplayResponderProxy();
      const eventCapture = proxy.setupEventCapture();
      const sessionId = SessionIdStub({ value: 'session-pasted-image-linked' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'replay-pasted-image-linked' });
      const guild = GuildStub({ id: guildId });
      const linkedWorkItem = WorkItemStub({
        role: 'chaoswhisperer',
        sessionId,
        status: 'complete',
      });
      const quest = QuestStub({ workItems: [linkedWorkItem] });
      const worktreePath = '/home/user/worktrees/quest-pasted-image';

      // Quest lookup runs FIRST in the responder. Stage it before the chatHistoryReplayBroker
      // stubs, which resolve their JSONL directory through questCwdResolveBroker BEFORE
      // touching any JSONL.
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

      // A linked quest sends questId into chatHistoryReplayBroker, which resolves the JSONL
      // directory via questCwdResolveBroker rather than the guild-path walk-up — without
      // staging an answer for it here, that mock throws unmatched-call, the responder's
      // catch swallows it silently, and no chat-output frame ever fires.
      proxy.setupQuestWorktree({ questId: quest.id, worktreePath });
      // homeDir MUST be '/home/user' here, matching guildConfigReadBrokerProxy's own internal
      // default: setupGuild's guildProxy.setupConfig() unconditionally stages an os.homedir()
      // answer even though guildGetBroker is never actually invoked on this (worktree) branch —
      // a phantom entry that would otherwise sit ahead of ours in the shared one-shot queue and
      // get picked up by chatHistoryReplayBroker's own (real) os.homedir() call instead.
      proxy.setupGuild({
        config: GuildConfigStub({ guilds: [guild] }),
        sessionId,
        homeDir: '/home/user',
      });
      proxy.setupMainSession({
        content:
          '{"type":"user","uuid":"pasted-image-linked-uuid","timestamp":"2025-01-01T00:00:01Z","message":{"role":"user","content":"A![Pasted Image 1](/p/x.png)B"}}',
      });
      proxy.setupSubagentDirMissing();

      await proxy.callResponder({ sessionId, guildId, chatProcessId });

      const events = eventCapture.getEmittedEvents();
      const chatOutputEvent = events.find((e) => e.type === 'chat-output');
      const entries = chatOutputEvent?.payload.entries as ChatOutputEntries | undefined;
      const userEntry = entries?.find(
        (entry): entry is ChatOutputUserEntry => entry.role === 'user',
      );

      expect(userEntry?.content).toBe(
        'A![Pasted Image 1](http://dungeonmaster.localhost:3737/api/images?path=%2Fp%2Fx.png)B',
      );
    });

    it('EDGE: {orphan session with no linked quest, main session user line carries a pasted-image token} => chat-output payload entry content is rewritten the same way and carries no questId', async () => {
      const proxy = ChatReplayResponderProxy();
      const eventCapture = proxy.setupEventCapture();
      const sessionId = SessionIdStub({ value: 'session-pasted-image-orphan' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'replay-pasted-image-orphan' });
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
        sessionId,
        homeDir: '/home/testuser',
      });
      proxy.setupMainSession({
        content:
          '{"type":"user","uuid":"pasted-image-orphan-uuid","timestamp":"2025-01-01T00:00:01Z","message":{"role":"user","content":"A![Pasted Image 1](/p/x.png)B"}}',
      });
      proxy.setupSubagentDirMissing();

      await proxy.callResponder({ sessionId, guildId, chatProcessId });

      const events = eventCapture.getEmittedEvents();
      const chatOutputEvent = events.find((e) => e.type === 'chat-output');
      const entries = chatOutputEvent?.payload.entries as ChatOutputEntries | undefined;
      const userEntry = entries?.find(
        (entry): entry is ChatOutputUserEntry => entry.role === 'user',
      );

      expect(userEntry?.content).toBe(
        'A![Pasted Image 1](http://dungeonmaster.localhost:3737/api/images?path=%2Fp%2Fx.png)B',
      );

      // Mirrors the "orphan session (no linked quest)" case above: exactly one chat-output
      // frame fired, and its payload keys carry no questId/workItemId.
      const chatOutputPayloadKeys = events
        .filter((e) => e.type === 'chat-output')
        .map((e) => Object.keys(e.payload).sort());

      expect(chatOutputPayloadKeys).toStrictEqual([
        ['chatProcessId', 'entries', 'replay', 'sessionId'],
      ]);
    });
  });

  describe('quest-scoped cwd resolution', () => {
    it('VALID: {session linked to a quest that records a worktreePath} => the replay reads the session directory derived from that worktree path', async () => {
      const proxy = ChatReplayResponderProxy();
      const eventCapture = proxy.setupEventCapture();
      const sessionId = SessionIdStub({ value: 'session-worktree' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'replay-worktree' });
      const guild = GuildStub({ id: guildId });
      const linkedWorkItem = WorkItemStub({
        role: 'chaoswhisperer',
        sessionId,
        status: 'complete',
      });
      const quest = QuestStub({ workItems: [linkedWorkItem] });
      const worktreePath = '/home/user/worktrees/quest-abc12345';

      // Quest lookup runs FIRST in the responder. Stage it before the chatHistoryReplayBroker
      // stubs, which now resolve their JSONL directory through questCwdResolveBroker BEFORE
      // touching any JSONL.
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

      proxy.setupQuestWorktree({ questId: quest.id, worktreePath });
      // homeDir MUST be '/home/user' here, matching guildConfigReadBrokerProxy's own internal
      // default: setupGuild's guildProxy.setupConfig() unconditionally stages an os.homedir()
      // answer even though guildGetBroker is never actually invoked on this (worktree) branch —
      // a phantom entry that would otherwise sit ahead of ours in the shared one-shot queue and
      // get picked up by chatHistoryReplayBroker's own (real) os.homedir() call instead.
      proxy.setupGuild({
        config: GuildConfigStub({ guilds: [guild] }),
        sessionId,
        homeDir: '/home/user',
      });
      // fsReadJsonlAdapterProxy addresses by the exact worktree-derived path — if the responder
      // stopped spreading questId into the chatHistoryReplayBroker call, the broker would fall
      // back to the guild-path walk-up instead, miss this staged address, and no chat-output
      // event would ever fire.
      proxy.setupMainSession({
        content:
          '{"type":"assistant","uuid":"worktree-line-uuid","timestamp":"2025-01-01T00:00:01Z","message":{"content":[{"type":"text","text":"worktree reply"}]}}',
      });
      proxy.setupSubagentDirMissing();

      await proxy.callResponder({ sessionId, guildId, chatProcessId });

      const events = eventCapture.getEmittedEvents();
      const chatOutputEvent = events.find((e) => e.type === 'chat-output');

      // `replay: true` is what tells the web this frame is a transcript read off disk rather
      // than an agent emitting. Without it, a subscribe-quest replay arms and disarms the
      // browser's running indicator once per work item and the FOLLOW-UP composer strobes
      // SEND↔STOP with nothing running.
      expect(chatOutputEvent).toStrictEqual({
        type: 'chat-output',
        processId: chatProcessId,
        payload: {
          chatProcessId,
          sessionId,
          replay: true,
          questId: quest.id,
          workItemId: linkedWorkItem.id,
          entries: [
            {
              role: 'assistant',
              type: 'text',
              content: 'worktree reply',
              source: 'session',
              uuid: 'worktree-line-uuid:0',
              timestamp: '2025-01-01T00:00:01Z',
            },
          ],
        },
      });
    });

    it('VALID: {orphan session with no linked quest} => the replay still reads the guild-path-derived directory', async () => {
      const proxy = ChatReplayResponderProxy();
      const eventCapture = proxy.setupEventCapture();
      const sessionId = SessionIdStub({ value: 'session-orphan-guild-path' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'replay-orphan-guild' });
      const guild = GuildStub({ id: guildId });

      // Quest list comes back EMPTY — sessionId belongs to no quest workItem, so the responder
      // calls chatHistoryReplayBroker with NO questId and the broker keeps the guild-path
      // walk-up. No questCwdResolveBroker staging needed — that branch is never reached.
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
        sessionId,
        homeDir: '/home/testuser',
      });
      proxy.setupMainSession({
        content:
          '{"type":"assistant","uuid":"guild-path-line-uuid","timestamp":"2025-01-01T00:00:01Z","message":{"content":[{"type":"text","text":"guild path reply"}]}}',
      });
      proxy.setupSubagentDirMissing();

      await proxy.callResponder({ sessionId, guildId, chatProcessId });

      const events = eventCapture.getEmittedEvents();
      const chatOutputEvent = events.find((e) => e.type === 'chat-output');

      expect(chatOutputEvent).toStrictEqual({
        type: 'chat-output',
        processId: chatProcessId,
        payload: {
          chatProcessId,
          sessionId,
          replay: true,
          entries: [
            {
              role: 'assistant',
              type: 'text',
              content: 'guild path reply',
              source: 'session',
              uuid: 'guild-path-line-uuid:0',
              timestamp: '2025-01-01T00:00:01Z',
            },
          ],
        },
      });
    });

    it('ERROR: {session linked to a quest whose recorded worktree is missing} => the responder rejects with a message naming the absolute path', async () => {
      const proxy = ChatReplayResponderProxy();
      const sessionId = SessionIdStub({ value: 'session-worktree-missing' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'replay-worktree-missing' });
      const linkedWorkItem = WorkItemStub({
        role: 'chaoswhisperer',
        sessionId,
        status: 'complete',
      });
      const quest = QuestStub({ workItems: [linkedWorkItem] });
      const worktreePath = '/home/testuser/worktrees/quest-missing-99';

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

      // The broker throws BEFORE ever computing a JSONL path — no setupGuild/setupMainSession
      // staged, matching the "must throw before touching any JSONL" contract.
      proxy.setupQuestWorktreeMissing({ questId: quest.id, worktreePath });

      await expect(proxy.callResponder({ sessionId, guildId, chatProcessId })).rejects.toThrow(
        /Cannot replay chat history for quest .*: worktree not found: \/home\/testuser\/worktrees\/quest-missing-99/u,
      );
    });

    it('VALID: {session linked to a quest whose recorded worktree is missing} => no chat-history-complete event is emitted', async () => {
      const proxy = ChatReplayResponderProxy();
      const eventCapture = proxy.setupEventCapture();
      const sessionId = SessionIdStub({ value: 'session-worktree-missing-no-complete' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'replay-worktree-missing-no-complete' });
      const linkedWorkItem = WorkItemStub({
        role: 'chaoswhisperer',
        sessionId,
        status: 'complete',
      });
      const quest = QuestStub({ workItems: [linkedWorkItem] });
      const worktreePath = '/home/testuser/worktrees/quest-missing-77';

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

      proxy.setupQuestWorktreeMissing({ questId: quest.id, worktreePath });

      await expect(proxy.callResponder({ sessionId, guildId, chatProcessId })).rejects.toThrow(
        /Cannot replay chat history for quest .*: worktree not found: \/home\/testuser\/worktrees\/quest-missing-77/u,
      );

      const events = eventCapture.getEmittedEvents();
      const completeEvents = events.filter((e) => e.type === 'chat-history-complete');

      expect(completeEvents).toStrictEqual([]);
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
        sessionId,
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
