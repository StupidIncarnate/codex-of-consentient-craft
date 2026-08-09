import {
  AbsoluteFilePathStub,
  GuildIdStub,
  QuestIdStub,
  QuestStub,
  SessionIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { chatPromptBuildTransformer } from '../../../transformers/chat-prompt-build/chat-prompt-build-transformer';
import { FollowupChatStartResponderProxy } from './followup-chat-start-responder.proxy';

// Matches the crypto.randomUUID literal sticky-mocked by chatSpawnBrokerProxy (composed inside
// FollowupChatStartResponderProxy) and the 'chat' processIdPrefix every non-glyphsmith chat role
// gets (chatSpawnBroker.ts: `role === 'glyphsmith' ? 'design' : 'chat'`).
const MINTED_CHAT_PROCESS_ID = 'chat-f47ac10b-58cc-4372-a567-0e02b2c3d479';
const MINTED_WORK_ITEM_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const FIXED_TIMESTAMP = '2024-01-15T10:00:00.000Z';

const awaitOnCompleteFireAndForget = async (): Promise<void> => {
  // Mirrors design-chat-start-responder.test.ts's own wait for the onComplete fire-and-forget
  // questModifyBroker chain: a nested setImmediate pair (spawn exit event, then the launcher's
  // onComplete handler) followed by a setTimeout(0) so the questModifyBroker promise chain
  // (find-quest-path -> load -> persist) settles before the assertion reads it.
  await new Promise<void>((resolve) => {
    setImmediate(() => {
      setImmediate(() => {
        setTimeout(resolve, 0);
      });
    });
  });
};

describe('FollowupChatStartResponder', () => {
  describe('creates a new tavernkeeper item', () => {
    it('VALID: {quest with no tavernkeeper item} => persists exactly one new tavernkeeper work item, in_progress, with empty relatedDataItems', async () => {
      const proxy = FollowupChatStartResponderProxy();
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'quest-1' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-1' });
      const quest = QuestStub({
        id: 'quest-1',
        folder: 'quest-1',
        status: 'complete',
        workItems: [],
        worktreePath,
      });

      proxy.setupNewTavernkeeperItem({ quest });

      await proxy.callResponder({ guildId, questId, message: 'What did you decide on auth?' });

      const persisted = proxy.getLastPersistedQuest();
      const tavernkeeperItem = persisted.workItems.find((wi) => wi.role === 'tavernkeeper');

      expect(tavernkeeperItem).toStrictEqual({
        id: MINTED_WORK_ITEM_ID,
        role: 'tavernkeeper',
        status: 'in_progress',
        spawnerType: 'agent',
        dependsOn: [],
        relatedDataItems: [],
        attempt: 0,
        maxAttempts: 1,
        retryCount: 0,
        createdAt: FIXED_TIMESTAMP,
        startedAt: FIXED_TIMESTAMP,
      });
    });

    it('VALID: {quest with no tavernkeeper item} => the persisted payload adds no operations entry and leaves quest.status unchanged', async () => {
      const proxy = FollowupChatStartResponderProxy();
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'quest-2' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-2' });
      const quest = QuestStub({
        id: 'quest-2',
        folder: 'quest-2',
        status: 'complete',
        workItems: [],
        operations: [],
        worktreePath,
      });

      proxy.setupNewTavernkeeperItem({ quest });

      await proxy.callResponder({ guildId, questId, message: 'What did you decide on auth?' });

      const persisted = proxy.getLastPersistedQuest();

      expect({ operations: persisted.operations, status: persisted.status }).toStrictEqual({
        operations: quest.operations,
        status: quest.status,
      });
    });
  });

  describe('resumes the existing tavernkeeper item', () => {
    it('VALID: {quest already carrying a tavernkeeper item with a sessionId} => spawns resuming that sessionId and mints no second item', async () => {
      const proxy = FollowupChatStartResponderProxy();
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'quest-3' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-3' });
      const sessionId = SessionIdStub({ value: 'tavern-session-3' });
      const existingWorkItemId = 'aaaaaaaa-1111-4222-9333-444444444444';
      const existingItem = WorkItemStub({
        id: existingWorkItemId,
        role: 'tavernkeeper',
        status: 'complete',
        sessionId,
      });
      const quest = QuestStub({
        id: 'quest-3',
        folder: 'quest-3',
        status: 'complete',
        workItems: [existingItem],
        worktreePath,
      });
      const message = 'Can you tweak the button color?';

      proxy.setupExistingTavernkeeperItem({ quest });

      await proxy.callResponder({ guildId, questId, message });

      expect(proxy.getSpawnedArgs()).toStrictEqual([
        '-p',
        message,
        '--output-format',
        'stream-json',
        '--verbose',
        '--model',
        'opus',
        '--chrome',
        '--settings',
        '{"hooks":{}}',
        '--resume',
        sessionId,
      ]);

      const persisted = proxy.getLastPersistedQuest();
      const tavernkeeperItems = persisted.workItems.filter((wi) => wi.role === 'tavernkeeper');

      expect(tavernkeeperItems).toStrictEqual([
        {
          id: existingWorkItemId,
          role: 'tavernkeeper',
          status: 'in_progress',
          spawnerType: 'agent',
          dependsOn: [],
          relatedDataItems: [],
          attempt: 0,
          maxAttempts: 1,
          retryCount: 0,
          createdAt: FIXED_TIMESTAMP,
          sessionId,
          startedAt: FIXED_TIMESTAMP,
        },
      ]);
    });

    it('VALID: {tavernkeeper item left in_progress with a sessionId} => still resumes that sessionId', async () => {
      const proxy = FollowupChatStartResponderProxy();
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'quest-4' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-4' });
      const sessionId = SessionIdStub({ value: 'tavern-session-4' });
      const existingItem = WorkItemStub({
        id: 'bbbbbbbb-1111-4222-9333-444444444444',
        role: 'tavernkeeper',
        status: 'in_progress',
        sessionId,
      });
      const quest = QuestStub({
        id: 'quest-4',
        folder: 'quest-4',
        status: 'complete',
        workItems: [existingItem],
        worktreePath,
      });
      const message = 'Are you still there?';

      proxy.setupExistingTavernkeeperItem({ quest });

      await proxy.callResponder({ guildId, questId, message });

      expect(proxy.getSpawnedArgs()).toStrictEqual([
        '-p',
        message,
        '--output-format',
        'stream-json',
        '--verbose',
        '--model',
        'opus',
        '--chrome',
        '--settings',
        '{"hooks":{}}',
        '--resume',
        sessionId,
      ]);
    });

    it('VALID: {tavernkeeper item exists with NO sessionId} => spawns with no sessionId argument', async () => {
      const proxy = FollowupChatStartResponderProxy();
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'quest-5' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-5' });
      const existingItem = WorkItemStub({
        id: 'cccccccc-1111-4222-9333-444444444444',
        role: 'tavernkeeper',
        status: 'failed',
      });
      const quest = QuestStub({
        id: 'quest-5',
        folder: 'quest-5',
        status: 'complete',
        workItems: [existingItem],
        worktreePath,
      });
      const message = 'Tell me about the login flow.';

      proxy.setupExistingTavernkeeperItem({ quest });

      await proxy.callResponder({ guildId, questId, message });

      const expectedPrompt = chatPromptBuildTransformer({
        role: 'tavernkeeper',
        message,
        questId,
      });

      expect(proxy.getSpawnedArgs()).toStrictEqual([
        '-p',
        expectedPrompt,
        '--output-format',
        'stream-json',
        '--verbose',
        '--model',
        'opus',
        '--chrome',
        '--settings',
        '{"hooks":{}}',
      ]);
    });
  });

  describe('event emission', () => {
    it('VALID: {spawn emits entries} => emits chat-output carrying questId and the tavernkeeper workItemId', async () => {
      const proxy = FollowupChatStartResponderProxy();
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'quest-6' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-6' });
      const sessionId = SessionIdStub({ value: 'tavern-session-6' });
      const workItemId = 'dddddddd-1111-4222-9333-444444444444';
      const existingItem = WorkItemStub({
        id: workItemId,
        role: 'tavernkeeper',
        status: 'complete',
        sessionId,
      });
      const quest = QuestStub({
        id: 'quest-6',
        folder: 'quest-6',
        status: 'complete',
        workItems: [existingItem],
        worktreePath,
      });
      const assistantLine = JSON.stringify({
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [{ type: 'text', text: 'The login flow validates credentials server-side.' }],
        },
      });

      proxy.setupExistingTavernkeeperItem({ quest, stdoutLines: [assistantLine] });
      const capture = proxy.captureEmits({ type: 'chat-output' });

      await proxy.callResponder({ guildId, questId, message: 'Explain the login flow' });

      await new Promise((resolve) => {
        setImmediate(resolve);
      });
      await new Promise((resolve) => {
        setImmediate(resolve);
      });
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      const [emitted] = capture;

      expect({
        processId: emitted?.processId,
        chatProcessId: emitted?.payload.chatProcessId,
        questId: emitted?.payload.questId,
        workItemId: emitted?.payload.workItemId,
      }).toStrictEqual({
        processId: MINTED_CHAT_PROCESS_ID,
        chatProcessId: MINTED_CHAT_PROCESS_ID,
        questId,
        workItemId,
      });
    });

    it('VALID: {spawn completes} => marks the tavernkeeper item complete and emits chat-complete with questId + workItemId', async () => {
      const proxy = FollowupChatStartResponderProxy();
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'quest-7' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-7' });
      const sessionId = SessionIdStub({ value: 'tavern-session-7' });
      const workItemId = 'eeeeeeee-1111-4222-9333-444444444444';
      const existingItem = WorkItemStub({
        id: workItemId,
        role: 'tavernkeeper',
        status: 'complete',
        sessionId,
      });
      const quest = QuestStub({
        id: 'quest-7',
        folder: 'quest-7',
        status: 'complete',
        workItems: [existingItem],
        worktreePath,
      });

      proxy.setupExistingTavernkeeperItem({ quest });
      const capture = proxy.captureEmits({ type: 'chat-complete' });

      await proxy.callResponder({ guildId, questId, message: 'Thanks, that answers it' });

      await awaitOnCompleteFireAndForget();

      const [emitted] = capture;

      expect({
        chatProcessId: emitted?.payload.chatProcessId,
        exitCode: emitted?.payload.exitCode,
        questId: emitted?.payload.questId,
        workItemId: emitted?.payload.workItemId,
      }).toStrictEqual({
        chatProcessId: MINTED_CHAT_PROCESS_ID,
        exitCode: 0,
        questId,
        workItemId,
      });

      const persisted = proxy.getLastPersistedQuest();
      const tavernkeeperItem = persisted.workItems.find((wi) => wi.role === 'tavernkeeper');

      expect(tavernkeeperItem?.status).toBe('complete');
    });
  });

  describe('error cases', () => {
    it("ERROR: {quest not found} => throws 'Quest not found: <id>'", async () => {
      const proxy = FollowupChatStartResponderProxy();
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'nonexistent-quest' });

      proxy.setupQuestNotFound();

      await expect(
        proxy.callResponder({ guildId, questId, message: 'Anyone home?' }),
      ).rejects.toThrow(/^Quest not found: nonexistent-quest$/u);
    });

    it('ERROR: {recorded worktree missing} => throws naming the absolute worktree path', async () => {
      const proxy = FollowupChatStartResponderProxy();
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'quest-9' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-9-missing' });
      const existingItem = WorkItemStub({
        id: 'ffffffff-1111-4222-9333-444444444444',
        role: 'tavernkeeper',
        status: 'complete',
      });
      const quest = QuestStub({
        id: 'quest-9',
        folder: 'quest-9',
        status: 'complete',
        workItems: [existingItem],
        worktreePath,
      });

      proxy.setupWorktreeMissing({ quest });

      await expect(
        proxy.callResponder({ guildId, questId, message: 'Still there?' }),
      ).rejects.toThrow(/\/repo\/worktrees\/quest-9-missing/u);
    });
  });
});
