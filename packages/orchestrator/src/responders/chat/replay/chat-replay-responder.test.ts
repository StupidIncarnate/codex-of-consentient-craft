import { FileMissingErrorStub } from '#gateway/node/fs/file-missing-error/file-missing-error.stub';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { SessionIdStub } from '@dungeonmaster/shared/contracts/session-id/session-id.stub';
import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import { HomeConfigStub } from '@dungeonmaster/shared/contracts/home-config/home-config.stub';
import { GuildStub } from '@dungeonmaster/shared/contracts/guild/guild.stub';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { WorkItemStub } from '@dungeonmaster/shared/contracts/work-item/work-item.stub';
import { pastedImageStatics } from '@dungeonmaster/shared/statics';

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
      const chatProcessId = 'replay-test';
      const guild = GuildStub({ id: guildId });

      proxy.setupGuild({
        config: HomeConfigStub({ guilds: [guild] }),
        sessionId,
        homeDir: '/home/testuser',
      });
      proxy.setupMainSession({ content: '' });
      proxy.setupSubagentDirMissing();

      proxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath: '/home/testuser/.dungeonmaster',
        questsPath: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`,
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
      const chatProcessId = 'replay-stamp';
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
      const questsPath = `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`;
      proxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath: '/home/testuser/.dungeonmaster',
        questsPath,
      });
      proxy.setupQuestDirectories({
        files: [quest.folder],
      });
      proxy.setupQuestFilePath({
        folderName: quest.folder,
        result: `${questsPath}/${quest.folder}/quest.json`,
      });
      proxy.setupQuestFile({
        questJson: JSON.stringify(quest),
      });

      proxy.setupGuild({
        config: HomeConfigStub({ guilds: [guild] }),
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
      const chatProcessId = 'replay-link';
      const guild = GuildStub({ id: guildId });
      const linkedWorkItem = WorkItemStub({
        role: 'chaoswhisperer',
        sessionId,
        status: 'complete',
      });
      const quest = QuestStub({ workItems: [linkedWorkItem] });

      // Quest lookup runs FIRST in the responder. Mocks consumed in setup order.
      const questsPath = `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`;
      proxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath: '/home/testuser/.dungeonmaster',
        questsPath,
      });
      proxy.setupQuestDirectories({
        files: [quest.folder],
      });
      proxy.setupQuestFilePath({
        folderName: quest.folder,
        result: `${questsPath}/${quest.folder}/quest.json`,
      });
      proxy.setupQuestFile({
        questJson: JSON.stringify(quest),
      });

      proxy.setupGuild({
        config: HomeConfigStub({ guilds: [guild] }),
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

  describe('orphan session (no linked quest)', () => {
    it('EDGE: {sessionId not linked to any quest workItem} => chat-output payload omits questId and workItemId', async () => {
      const proxy = ChatReplayResponderProxy();
      const eventCapture = proxy.setupEventCapture();
      const sessionId = SessionIdStub({ value: 'session-orphan' });
      const guildId = GuildIdStub();
      const chatProcessId = 'replay-orphan';
      const guild = GuildStub({ id: guildId });

      // Quest list comes back EMPTY — sessionId belongs to no quest workItem.
      proxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath: '/home/testuser/.dungeonmaster',
        questsPath: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`,
      });
      proxy.setupQuestDirectories({ files: [] });

      proxy.setupGuild({
        config: HomeConfigStub({ guilds: [guild] }),
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

  describe('quest lookup failures', () => {
    it('VALID: {guild has no quests directory yet (ENOENT)} => replays the session as an orphan and emits chat-history-complete', async () => {
      const proxy = ChatReplayResponderProxy();
      const eventCapture = proxy.setupEventCapture();
      const sessionId = SessionIdStub({ value: 'session-no-quests-dir' });
      const guildId = GuildIdStub();
      const chatProcessId = 'replay-no-quests-dir';
      const guild = GuildStub({ id: guildId });
      const questsPath = `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`;

      proxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath: '/home/testuser/.dungeonmaster',
        questsPath,
      });
      proxy.setupQuestDirectoriesFailure({ error: FileMissingErrorStub({ path: questsPath }) });
      proxy.setupGuild({
        config: HomeConfigStub({ guilds: [guild] }),
        sessionId,
        homeDir: '/home/testuser',
      });
      proxy.setupMainSession({ content: '' });
      proxy.setupSubagentDirMissing();

      await proxy.callResponder({ sessionId, guildId, chatProcessId });

      expect(eventCapture.getEmittedEvents()).toStrictEqual([
        {
          type: 'chat-history-complete',
          processId: chatProcessId,
          payload: { chatProcessId, sessionId },
        },
      ]);
    });

    it('ERROR: {quests directory unreadable (EACCES)} => rejects with the original error and emits nothing', async () => {
      const proxy = ChatReplayResponderProxy();
      const eventCapture = proxy.setupEventCapture();
      const sessionId = SessionIdStub({ value: 'session-quests-dir-denied' });
      const guildId = GuildIdStub();
      const chatProcessId = 'replay-quests-dir-denied';
      const questsPath = `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`;

      proxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath: '/home/testuser/.dungeonmaster',
        questsPath,
      });
      proxy.setupQuestDirectoriesFailure({
        error: FsErrorStub({ code: 'EACCES', syscall: 'scandir', path: questsPath }),
      });

      await expect(proxy.callResponder({ sessionId, guildId, chatProcessId })).rejects.toThrow(
        `EACCES: scandir '${questsPath}'`,
      );
      expect(eventCapture.getEmittedEvents()).toStrictEqual([]);
    });
  });

  describe('pasted-image path rewriting', () => {
    it('VALID: {session linked to a quest, main session user line carries a pasted-image token} => chat-output payload entry content is the rewritten /api/images URL', async () => {
      const proxy = ChatReplayResponderProxy();
      const eventCapture = proxy.setupEventCapture();
      const sessionId = SessionIdStub({ value: 'session-pasted-image-linked' });
      const guildId = GuildIdStub();
      const chatProcessId = 'replay-pasted-image-linked';
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
      const questsPath = `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`;
      proxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath: '/home/testuser/.dungeonmaster',
        questsPath,
      });
      proxy.setupQuestDirectories({
        files: [quest.folder],
      });
      proxy.setupQuestFilePath({
        folderName: quest.folder,
        result: `${questsPath}/${quest.folder}/quest.json`,
      });
      proxy.setupQuestFile({
        questJson: JSON.stringify(quest),
      });

      // A linked quest sends questId into chatHistoryReplayBroker, which resolves the JSONL
      // directory via questCwdResolveBroker rather than the guild-path walk-up — without
      // staging an answer for it here, that mock throws unmatched-call, the responder's
      // catch swallows it silently, and no chat-output frame ever fires.
      proxy.setupQuestWorktree({ questId: quest.id, worktreePath });
      // homeDir MUST match setupQuestsPath's own '/home/testuser' above: `homedir()` is now ONE
      // shared gateway mock (`#gateway/node/os`) across the whole call chain — questListBroker's
      // own dungeonmasterHomeFindBroker() resolution and chatHistoryReplayBroker's own
      // `~/.claude/projects/` resolution read the identical staged answer, exactly as a real
      // machine has exactly one home directory. A mismatched value here starves whichever call
      // loses the race for the "most recent" stage, throws unmatched, and the responder's own
      // catch swallows it silently — no chat-output frame ever fires.
      proxy.setupGuild({
        config: HomeConfigStub({ guilds: [guild] }),
        sessionId,
        homeDir: '/home/testuser',
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

      // Byte-identical to the orphan case's own assertion below — same seeded line, same
      // rewrite, on the quest-linked branch instead of the orphan one. Proves the rewrite
      // itself does not vary with quest-linkage.
      expect(userEntry?.content).toBe(
        'A![Pasted Image 1](http://dungeonmaster.localhost:3737/api/images?path=%2Fp%2Fx.png)B',
      );

      // Unlike the orphan case, THIS session's sessionId matches a quest workItem — the
      // payload must carry questId + workItemId. Asserting the full sorted key list (not just
      // presence of one key) is what proves the shape actually differs from the orphan
      // payload's four-key shape below, rather than merely having an extra key alongside an
      // unasserted rest.
      const chatOutputPayloadKeys = events
        .filter((e) => e.type === 'chat-output')
        .map((e) => Object.keys(e.payload).sort());

      expect(chatOutputPayloadKeys).toStrictEqual([
        ['chatProcessId', 'entries', 'questId', 'replay', 'sessionId', 'workItemId'],
      ]);
    });

    it('EDGE: {orphan session with no linked quest, main session user line carries a pasted-image token} => chat-output payload entry content is rewritten the same way and carries no questId', async () => {
      const proxy = ChatReplayResponderProxy();
      const eventCapture = proxy.setupEventCapture();
      const sessionId = SessionIdStub({ value: 'session-pasted-image-orphan' });
      const guildId = GuildIdStub();
      const chatProcessId = 'replay-pasted-image-orphan';
      const guild = GuildStub({ id: guildId });

      // Quest list comes back EMPTY — sessionId belongs to no quest workItem.
      proxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath: '/home/testuser/.dungeonmaster',
        questsPath: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`,
      });
      proxy.setupQuestDirectories({ files: [] });

      proxy.setupGuild({
        config: HomeConfigStub({ guilds: [guild] }),
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

      // Byte-identical to the quest-linked case's own assertion above — same seeded line,
      // same rewrite, on the orphan branch instead of the quest-linked one.
      expect(userEntry?.content).toBe(
        'A![Pasted Image 1](http://dungeonmaster.localhost:3737/api/images?path=%2Fp%2Fx.png)B',
      );

      // Mirrors the "orphan session (no linked quest)" case above: exactly one chat-output
      // frame fired, and its payload keys carry no questId/workItemId — unlike the quest-linked
      // case above, whose payload keys include both.
      const chatOutputPayloadKeys = events
        .filter((e) => e.type === 'chat-output')
        .map((e) => Object.keys(e.payload).sort());

      expect(chatOutputPayloadKeys).toStrictEqual([
        ['chatProcessId', 'entries', 'replay', 'sessionId'],
      ]);
    });

    it('VALID: {main session user line content is "A![Pasted Image 1](/p/x.png)B"} => chat-output payload entries is exactly one user-role entry', async () => {
      const proxy = ChatReplayResponderProxy();
      const eventCapture = proxy.setupEventCapture();
      const sessionId = SessionIdStub({ value: 'session-pasted-image-single-entry' });
      const guildId = GuildIdStub();
      const chatProcessId = 'replay-pasted-image-single-entry';
      const guild = GuildStub({ id: guildId });
      const lineUuid = 'pasted-image-single-entry-uuid';

      // Quest list comes back EMPTY — sessionId belongs to no quest workItem. What this case
      // measures — whether the image token splits the line into more than one entry — does not
      // depend on quest-linkage, so the orphan branch is the simplest path that still emits
      // chat-output.
      proxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath: '/home/testuser/.dungeonmaster',
        questsPath: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`,
      });
      proxy.setupQuestDirectories({ files: [] });

      proxy.setupGuild({
        config: HomeConfigStub({ guilds: [guild] }),
        sessionId,
        homeDir: '/home/testuser',
      });
      proxy.setupMainSession({
        content: `{"type":"user","uuid":"${lineUuid}","timestamp":"2025-01-01T00:00:01Z","message":{"role":"user","content":"A![Pasted Image 1](/p/x.png)B"}}`,
      });
      proxy.setupSubagentDirMissing();

      await proxy.callResponder({ sessionId, guildId, chatProcessId });

      const events = eventCapture.getEmittedEvents();
      const chatOutputEvent = events.find((e) => e.type === 'chat-output');
      const entries = chatOutputEvent?.payload.entries as ChatOutputEntries | undefined;

      // A regression that splits the image token into a separate entry (or drops the line
      // entirely) shows up here as a two-member or zero-member array — asserting the full
      // one-member array (not just its length) proves the count AND the entry's exact shape
      // — role 'user', the rewritten uuid, content, source and timestamp — in one assertion.
      expect(entries).toStrictEqual([
        {
          role: 'user',
          content: `A![Pasted Image 1](http://dungeonmaster.localhost:3737${pastedImageStatics.serveRoutePath}?path=%2Fp%2Fx.png)B`,
          source: 'session',
          uuid: `${lineUuid}:user`,
          timestamp: '2025-01-01T00:00:01Z',
        },
      ]);
    });

    it('VALID: {main session user line carries an image token AND a markdown link to a .md file} => chat-output payload entry content rewrites only the image token, leaving the .md link byte-identical', async () => {
      const proxy = ChatReplayResponderProxy();
      const eventCapture = proxy.setupEventCapture();
      const sessionId = SessionIdStub({ value: 'session-pasted-image-with-md-link' });
      const guildId = GuildIdStub();
      const chatProcessId = 'replay-pasted-image-with-md-link';
      const guild = GuildStub({ id: guildId });

      proxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath: '/home/testuser/.dungeonmaster',
        questsPath: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`,
      });
      proxy.setupQuestDirectories({ files: [] });

      proxy.setupGuild({
        config: HomeConfigStub({ guilds: [guild] }),
        sessionId,
        homeDir: '/home/testuser',
      });
      proxy.setupMainSession({
        content:
          '{"type":"user","uuid":"pasted-image-md-link-uuid","timestamp":"2025-01-01T00:00:01Z","message":{"role":"user","content":"See ![Pasted Image 1](/p/x.png) and [notes](/p/readme.md)"}}',
      });
      proxy.setupSubagentDirMissing();

      await proxy.callResponder({ sessionId, guildId, chatProcessId });

      const events = eventCapture.getEmittedEvents();
      const chatOutputEvent = events.find((e) => e.type === 'chat-output');
      const entries = chatOutputEvent?.payload.entries as ChatOutputEntries | undefined;
      const userEntry = entries?.find(
        (entry): entry is ChatOutputUserEntry => entry.role === 'user',
      );

      // A single toBe on the WHOLE string proves both halves at once: the .md link rides
      // through byte-identical (no leading `!`, so imageTokenPattern never matches it) AND the
      // image token IS rewritten to the /api/images URL — a rewriter that touched nothing at
      // all would pass the .md-link half alone, and this assertion would still catch it via the
      // untouched image token.
      expect(userEntry?.content).toBe(
        `See ![Pasted Image 1](http://dungeonmaster.localhost:3737${pastedImageStatics.serveRoutePath}?path=%2Fp%2Fx.png) and [notes](/p/readme.md)`,
      );
    });

    it('VALID: {DUNGEONMASTER_PORT set to a distinctive value, main session user line carries a pasted-image token} => chat-output payload entry content carries an http URL built from that port, with no bare filesystem path anywhere in it', async () => {
      const proxy = ChatReplayResponderProxy();
      const eventCapture = proxy.setupEventCapture();
      const sessionId = SessionIdStub({ value: 'session-pasted-image-distinctive-port' });
      const guildId = GuildIdStub();
      const chatProcessId = 'replay-pasted-image-distinctive-port';
      const guild = GuildStub({ id: guildId });

      proxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath: '/home/testuser/.dungeonmaster',
        questsPath: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`,
      });
      proxy.setupQuestDirectories({ files: [] });

      proxy.setupGuild({
        config: HomeConfigStub({ guilds: [guild] }),
        sessionId,
        homeDir: '/home/testuser',
      });
      // portResolveBroker reads DUNGEONMASTER_PORT at call time — inside chatHistoryReplayBroker,
      // when it builds serverBaseUrl via questGetServerConfigBroker(). Pinning it here to a
      // value distinct from the file-wide default (3737, staged by
      // chatHistoryReplayBrokerProxy's own constructor for every OTHER test in this file) is
      // what proves the URL is RESOLVED at call time rather than hardcoded.
      proxy.setPort({ value: '48213' });
      proxy.setupMainSession({
        content:
          '{"type":"user","uuid":"pasted-image-distinctive-port-uuid","timestamp":"2025-01-01T00:00:01Z","message":{"role":"user","content":"A![Pasted Image 1](/p/x.png)B"}}',
      });
      proxy.setupSubagentDirMissing();

      await proxy.callResponder({ sessionId, guildId, chatProcessId });

      // Restore the file-wide default right after the call — nothing later in this test reads
      // the env var again, and every test in this file after this one expects it back at 3737.
      proxy.setPort({ value: '3737' });

      const events = eventCapture.getEmittedEvents();
      const chatOutputEvent = events.find((e) => e.type === 'chat-output');
      const entries = chatOutputEvent?.payload.entries as ChatOutputEntries | undefined;
      const userEntry = entries?.find(
        (entry): entry is ChatOutputUserEntry => entry.role === 'user',
      );

      // Asserting the WHOLE string is what proves no bare filesystem path survived anywhere in
      // it, and that the port embedded is the one just staged (48213) rather than the 3737
      // default.
      expect(userEntry?.content).toBe(
        `A![Pasted Image 1](http://dungeonmaster.localhost:48213${pastedImageStatics.serveRoutePath}?path=%2Fp%2Fx.png)B`,
      );
    });
  });

  describe('quest-scoped cwd resolution', () => {
    it('VALID: {session linked to a quest that records a worktreePath} => the replay reads the session directory derived from that worktree path', async () => {
      const proxy = ChatReplayResponderProxy();
      const eventCapture = proxy.setupEventCapture();
      const sessionId = SessionIdStub({ value: 'session-worktree' });
      const guildId = GuildIdStub();
      const chatProcessId = 'replay-worktree';
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
      const questsPath = `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`;
      proxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath: '/home/testuser/.dungeonmaster',
        questsPath,
      });
      proxy.setupQuestDirectories({
        files: [quest.folder],
      });
      proxy.setupQuestFilePath({
        folderName: quest.folder,
        result: `${questsPath}/${quest.folder}/quest.json`,
      });
      proxy.setupQuestFile({
        questJson: JSON.stringify(quest),
      });

      proxy.setupQuestWorktree({ questId: quest.id, worktreePath });
      // homeDir MUST match setupQuestsPath's own '/home/testuser' above: `homedir()` is now ONE
      // shared gateway mock (`#gateway/node/os`) across the whole call chain — questListBroker's
      // own dungeonmasterHomeFindBroker() resolution and chatHistoryReplayBroker's own
      // `~/.claude/projects/` resolution read the identical staged answer, exactly as a real
      // machine has exactly one home directory. A mismatched value here starves whichever call
      // loses the race for the "most recent" stage, throws unmatched, and the responder's own
      // catch swallows it silently — no chat-output frame ever fires.
      proxy.setupGuild({
        config: HomeConfigStub({ guilds: [guild] }),
        sessionId,
        homeDir: '/home/testuser',
      });
      // readNonEmptyLinesProxy addresses by the exact worktree-derived path — if the responder
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
      const chatProcessId = 'replay-orphan-guild';
      const guild = GuildStub({ id: guildId });

      // Quest list comes back EMPTY — sessionId belongs to no quest workItem, so the responder
      // calls chatHistoryReplayBroker with NO questId and the broker keeps the guild-path
      // walk-up. No questCwdResolveBroker staging needed — that branch is never reached.
      proxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath: '/home/testuser/.dungeonmaster',
        questsPath: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`,
      });
      proxy.setupQuestDirectories({ files: [] });

      proxy.setupGuild({
        config: HomeConfigStub({ guilds: [guild] }),
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
      const chatProcessId = 'replay-worktree-missing';
      const linkedWorkItem = WorkItemStub({
        role: 'chaoswhisperer',
        sessionId,
        status: 'complete',
      });
      const quest = QuestStub({ workItems: [linkedWorkItem] });
      const worktreePath = '/home/testuser/worktrees/quest-missing-99';

      const questsPath = `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`;
      proxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath: '/home/testuser/.dungeonmaster',
        questsPath,
      });
      proxy.setupQuestDirectories({
        files: [quest.folder],
      });
      proxy.setupQuestFilePath({
        folderName: quest.folder,
        result: `${questsPath}/${quest.folder}/quest.json`,
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
      const chatProcessId = 'replay-worktree-missing-no-complete';
      const linkedWorkItem = WorkItemStub({
        role: 'chaoswhisperer',
        sessionId,
        status: 'complete',
      });
      const quest = QuestStub({ workItems: [linkedWorkItem] });
      const worktreePath = '/home/testuser/worktrees/quest-missing-77';

      const questsPath = `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`;
      proxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath: '/home/testuser/.dungeonmaster',
        questsPath,
      });
      proxy.setupQuestDirectories({
        files: [quest.folder],
      });
      proxy.setupQuestFilePath({
        folderName: quest.folder,
        result: `${questsPath}/${quest.folder}/quest.json`,
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
        config: HomeConfigStub({ guilds: [guild] }),
        sessionId,
        homeDir: '/home/testuser',
      });
      proxy.setupMainSession({ content: '' });
      proxy.setupSubagentDirMissing();

      proxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath: '/home/testuser/.dungeonmaster',
        questsPath: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`,
      });
      proxy.setupQuestDirectories({ files: [] });

      await proxy.callResponder({ sessionId, guildId });

      const events = eventCapture.getEmittedEvents();
      const completeEvent = events.find((e) => e.type === 'chat-history-complete');

      expect(completeEvent?.processId).toBe('replay-f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });
  });
});
