import {
  FilePathStub,
  GuildIdStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  RepoRootCwdStub,
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
          startPath: FilePathStub({ value: '/project/src' }),
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
          startPath: FilePathStub({ value: '/project/src' }),
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
          startPath: FilePathStub({ value: '/project/src' }),
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
          startPath: FilePathStub({ value: '/project/src' }),
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
        startPath: FilePathStub({ value: '/project/src' }),
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
        '--settings',
        '{"hooks":{}}',
        '--resume',
        existingSessionId,
      ]);
    });

    it('VALID: {cwdResolveBroker resolves repo root} => passes resolved RepoRootCwd as cwd to spawn', async () => {
      const proxy = runChatLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const workItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        role: 'chaoswhisperer',
        status: 'in_progress',
      });
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth', workItems: [workItem] });
      const resolvedRepoRoot = RepoRootCwdStub({ value: '/resolved/repo/root' });
      proxy.setupCwdResolveSuccess({ repoRoot: resolvedRepoRoot });
      proxy.setupQuestFound({ quest });

      await runChatLayerBroker({
        questId,
        workItem,
        startPath: FilePathStub({ value: '/resolved/repo/root/packages/foo' }),
        userMessage: UserInputStub({ value: 'Help me build auth' }),
        guildId: GuildIdStub(),
        onAgentEntry: jest.fn(),
      });

      const spawnedCwd = proxy.getSpawnedCwd();

      expect(spawnedCwd).toBe(resolvedRepoRoot);
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
        startPath: FilePathStub({ value: '/project/src' }),
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

    it('EDGE: {cwdResolveBroker rejects} => falls back to parsing startPath via repoRootCwdContract and uses it as cwd', async () => {
      const proxy = runChatLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const workItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        role: 'chaoswhisperer',
        status: 'in_progress',
      });
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth', workItems: [workItem] });
      const fallbackPath = '/standalone/project/src';
      proxy.setupCwdResolveReject({ error: new Error('no .dungeonmaster.json ancestor') });
      proxy.setupQuestFound({ quest });

      await runChatLayerBroker({
        questId,
        workItem,
        startPath: FilePathStub({ value: fallbackPath }),
        userMessage: UserInputStub({ value: 'Help me build auth' }),
        guildId: GuildIdStub(),
        onAgentEntry: jest.fn(),
      });

      const spawnedCwd = proxy.getSpawnedCwd();

      expect(spawnedCwd).toBe(RepoRootCwdStub({ value: fallbackPath }));
    });
  });
});
