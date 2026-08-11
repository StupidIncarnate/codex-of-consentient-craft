import {
  AbsoluteFilePathStub,
  GuildIdStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  SessionIdStub,
  UserInputStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { runChatLayerBroker } from './run-chat-layer-broker';
import { runChatLayerBrokerProxy } from './run-chat-layer-broker.proxy';

describe('runChatLayerBroker', () => {
  describe('basic spawn', () => {
    it('VALID: {chaoswhisperer work item} => spawns agent and completes work item', async () => {
      const proxy = runChatLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const workItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        role: 'chaoswhisperer',
        status: 'in_progress',
      });
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth', workItems: [workItem] });
      proxy.setupQuestFound({ quest });

      await expect(
        runChatLayerBroker({
          questId,
          workItem,
          userMessage: UserInputStub({ value: 'Help me build auth' }),
          guildId: GuildIdStub(),
          onAgentEntry: jest.fn(),
        }),
      ).resolves.toStrictEqual({ success: true });
    });

    it('VALID: {glyphsmith work item} => spawns agent and completes work item', async () => {
      const proxy = runChatLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const workItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        role: 'glyphsmith',
        status: 'in_progress',
      });
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth', workItems: [workItem] });
      proxy.setupQuestFound({ quest });

      await expect(
        runChatLayerBroker({
          questId,
          workItem,
          userMessage: UserInputStub({ value: 'Design the login page' }),
          guildId: GuildIdStub(),
          onAgentEntry: jest.fn(),
        }),
      ).resolves.toStrictEqual({ success: true });
    });

    it('ERROR: {spawn throws} => marks work item as failed and rethrows', async () => {
      const proxy = runChatLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const workItemId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'chaoswhisperer',
        status: 'in_progress',
      });
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth', workItems: [workItem] });
      proxy.setupSpawnThrow({ quest });

      await expect(
        runChatLayerBroker({
          questId,
          workItem,
          userMessage: UserInputStub({ value: 'Help me build auth' }),
          guildId: GuildIdStub(),
          onAgentEntry: jest.fn(),
        }),
      ).rejects.toThrow(/spawn claude ENOENT/u);

      const status = proxy.getLastPersistedWorkItemStatus({ workItemId });

      expect(status).toBe('failed');
    });

    it('ERROR: {agent exits with non-zero code} => marks work item as failed', async () => {
      const proxy = runChatLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const workItemId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'chaoswhisperer',
        status: 'in_progress',
      });
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth', workItems: [workItem] });
      proxy.setupSpawnNonZeroExit({ quest });

      await expect(
        runChatLayerBroker({
          questId,
          workItem,
          userMessage: UserInputStub({ value: 'Help me build auth' }),
          guildId: GuildIdStub(),
          onAgentEntry: jest.fn(),
        }),
      ).rejects.toThrow(/Chat agent exited with code 1/u);

      const status = proxy.getLastPersistedWorkItemStatus({ workItemId });

      expect(status).toBe('failed');
    });

    it('VALID: {work item with existing sessionId} => passes resumeSessionId to spawn and sends raw message', async () => {
      const proxy = runChatLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const existingSessionId = SessionIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const workItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        role: 'chaoswhisperer',
        status: 'in_progress',
        sessionId: existingSessionId,
      });
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth', workItems: [workItem] });
      proxy.setupQuestFound({ quest });

      const userMessage = UserInputStub({ value: 'Continue building auth' });

      await runChatLayerBroker({
        questId,
        workItem,
        userMessage,
        guildId: GuildIdStub(),
        onAgentEntry: jest.fn(),
      });

      const spawnedArgs = proxy.getSpawnedArgs();

      // resumeSessionId forwarded to spawn via --resume flag; raw message sent (no template)
      expect(spawnedArgs).toStrictEqual([
        '-p',
        String(userMessage),
        '--output-format',
        'stream-json',
        '--verbose',
        '--model',
        'opus',
        '--chrome',
        '--settings',
        '{"hooks":{}}',
        '--resume',
        existingSessionId,
      ]);
    });

    it('VALID: {quest records a worktreePath} => the agent is launched with that worktree path as cwd', async () => {
      const proxy = runChatLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const workItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        role: 'chaoswhisperer',
        status: 'in_progress',
      });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth' });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        workItems: [workItem],
        worktreePath,
      });
      proxy.setupWorktreeFound({ quest });

      await runChatLayerBroker({
        questId,
        workItem,
        userMessage: UserInputStub({ value: 'Help me build auth' }),
        guildId: GuildIdStub(),
        onAgentEntry: jest.fn(),
      });

      const spawnedCwd = proxy.getSpawnedCwd();

      expect(spawnedCwd).toBe(worktreePath);
    });

    it('VALID: {agent emits line} => onAgentEntry callback receives workItem.id as questWorkItemId so responder can stamp questId+workItemId on chat-output payload', async () => {
      const proxy = runChatLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const workItemId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'chaoswhisperer',
        status: 'in_progress',
      });
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth', workItems: [workItem] });
      const lines = ['{"type":"assistant","message":{"content":[]}}'] as const;
      proxy.setupSpawnSuccess({ quest, lines });

      // Simulate the responder closure: it has questId in scope and stamps it onto each
      // payload alongside the broker-supplied questWorkItemId from the callback params.
      const stampedPayloads: { questId: typeof questId; questWorkItemId: typeof workItemId }[] = [];
      const onAgentEntry = jest.fn(({ questWorkItemId: cbWorkItemId }) => {
        stampedPayloads.push({ questId, questWorkItemId: cbWorkItemId });
      });

      await runChatLayerBroker({
        questId,
        workItem,
        guildId: GuildIdStub(),
        userMessage: UserInputStub({ value: 'Help me build auth' }),
        onAgentEntry,
      });

      expect(onAgentEntry).toHaveBeenCalledTimes(1);
      expect(onAgentEntry).toHaveBeenCalledWith({
        slotIndex: 0,
        entries: expect.any(Array),
        questWorkItemId: workItemId,
      });
      expect(stampedPayloads).toStrictEqual([{ questId, questWorkItemId: workItemId }]);
    });

    it("ERROR: {quest's recorded worktree is missing} => the work item is marked failed carrying the path in its errorMessage, and the error propagates", async () => {
      const proxy = runChatLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const workItemId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'chaoswhisperer',
        status: 'in_progress',
      });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth' });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        workItems: [workItem],
        worktreePath,
      });
      proxy.setupWorktreeMissing({ quest });

      await expect(
        runChatLayerBroker({
          questId,
          workItem,
          userMessage: UserInputStub({ value: 'Help me build auth' }),
          guildId: GuildIdStub(),
          onAgentEntry: jest.fn(),
        }),
      ).rejects.toThrow(/\/repo\/worktrees\/add-auth/u);

      const status = proxy.getLastPersistedWorkItemStatus({ workItemId });
      const errorMessage = proxy.getLastPersistedWorkItemErrorMessage({ workItemId });

      expect(status).toBe('failed');
      expect(errorMessage).toBe(
        'Cannot start chat for quest add-auth: worktree not found: /repo/worktrees/add-auth',
      );
    });
  });
});
