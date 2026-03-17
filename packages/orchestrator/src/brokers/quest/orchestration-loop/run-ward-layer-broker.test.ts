import {
  DependencyStepStub,
  ExitCodeStub,
  FilePathStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { runWardLayerBroker } from './run-ward-layer-broker';
import { runWardLayerBrokerProxy } from './run-ward-layer-broker.proxy';

describe('runWardLayerBroker', () => {
  describe('export', () => {
    it('VALID: {module} => exports a function', () => {
      expect(typeof runWardLayerBroker).toBe('function');
    });
  });

  describe('PASS (exit code 0)', () => {
    it('VALID: {ward exits 0} => marks ward complete with completedAt', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const workItemId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'ward',
        status: 'in_progress',
        spawnerType: 'command',
        maxAttempts: 3,
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [workItem],
      });

      const proxy = runWardLayerBrokerProxy();
      proxy.setupWardPass({ quest });

      await runWardLayerBroker({
        questId,
        workItem,
        startPath: FilePathStub({ value: '/project' }),
      });

      const status = proxy.getLastPersistedWorkItemStatus({ workItemId });

      expect(status).toBe('complete');

      const lastQuest = proxy.getPersistedQuestAt({ index: 0 });
      const wardItem = lastQuest.workItems.find((wi) => wi.id === workItemId);

      expect(wardItem?.completedAt).toBe('2024-01-15T10:00:00.000Z');
    });
  });

  describe('FAIL (retries left, filePaths present)', () => {
    it('VALID: {ward fails, quest steps have files, attempt 0 of 3} => stores wardResult with filePaths and exitCode', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const workItemId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({
        filesToModify: ['/project/src/file-a.ts' as never],
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'ward',
        status: 'in_progress',
        spawnerType: 'command',
        attempt: 0,
        maxAttempts: 3,
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        steps: [step],
        workItems: [workItem],
      });

      const proxy = runWardLayerBrokerProxy();
      proxy.setupDeterministicUuids({
        uuids: [
          '11111111-1111-4111-8111-111111111111',
          '22222222-2222-4222-8222-222222222222',
          '33333333-3333-4333-8333-333333333333',
        ],
      });
      proxy.setupWardFailWithRetry({
        quest,
        exitCode: ExitCodeStub({ value: 1 }),
      });

      await runWardLayerBroker({
        questId,
        workItem,
        startPath: FilePathStub({ value: '/project' }),
      });

      const firstQuest = proxy.getPersistedQuestAt({ index: 0 });
      const storedWardResult = firstQuest.wardResults[firstQuest.wardResults.length - 1];

      expect(storedWardResult?.id).toBe('11111111-1111-4111-8111-111111111111');
      expect(storedWardResult?.exitCode).toBe(1);
      expect(storedWardResult?.filePaths).toStrictEqual(['/project/src/file-a.ts']);
    });

    it('VALID: {ward fails, attempt 0 of 3} => marks ward as failed with ward_failed errorMessage', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const workItemId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({
        filesToModify: ['/project/src/file-a.ts' as never],
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'ward',
        status: 'in_progress',
        spawnerType: 'command',
        attempt: 0,
        maxAttempts: 3,
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        steps: [step],
        workItems: [workItem],
      });

      const proxy = runWardLayerBrokerProxy();
      proxy.setupDeterministicUuids({
        uuids: [
          '11111111-1111-4111-8111-111111111111',
          '22222222-2222-4222-8222-222222222222',
          '33333333-3333-4333-8333-333333333333',
        ],
      });
      proxy.setupWardFailWithRetry({
        quest,
        exitCode: ExitCodeStub({ value: 1 }),
      });

      await runWardLayerBroker({
        questId,
        workItem,
        startPath: FilePathStub({ value: '/project' }),
      });

      const secondQuest = proxy.getPersistedQuestAt({ index: 1 });
      const failedWard = secondQuest.workItems.find((wi) => wi.id === workItemId);

      expect(failedWard?.status).toBe('failed');
      expect(failedWard?.errorMessage).toBe('ward_failed');
    });
  });

  describe('FAIL (retries left, no filePaths)', () => {
    it('VALID: {ward fails, no files in steps, attempt 0 of 3} => stores wardResult with empty filePaths', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const workItemId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'ward',
        status: 'in_progress',
        spawnerType: 'command',
        attempt: 0,
        maxAttempts: 3,
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [workItem],
      });

      const proxy = runWardLayerBrokerProxy();
      proxy.setupDeterministicUuids({
        uuids: ['11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333'],
      });
      proxy.setupWardFailWithRetry({
        quest,
        exitCode: ExitCodeStub({ value: 1 }),
      });

      await runWardLayerBroker({
        questId,
        workItem,
        startPath: FilePathStub({ value: '/project' }),
      });

      const firstQuest = proxy.getPersistedQuestAt({ index: 0 });
      const storedWardResult = firstQuest.wardResults[firstQuest.wardResults.length - 1];

      expect(storedWardResult?.exitCode).toBe(1);
      expect(storedWardResult?.filePaths).toStrictEqual([]);

      const status = proxy.getLastPersistedWorkItemStatus({ workItemId });

      expect(status).toBe('failed');
    });
  });

  describe('FAIL (no retries left)', () => {
    it('VALID: {ward fails, attempt 2 of 3} => marks ward failed, only 2 persists', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const workItemId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'ward',
        status: 'in_progress',
        spawnerType: 'command',
        attempt: 2,
        maxAttempts: 3,
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [workItem],
      });

      const proxy = runWardLayerBrokerProxy();
      proxy.setupDeterministicUuids({
        uuids: ['11111111-1111-4111-8111-111111111111'],
      });
      proxy.setupWardFailNoRetry({
        quest,
        exitCode: ExitCodeStub({ value: 1 }),
      });

      await runWardLayerBroker({
        questId,
        workItem,
        startPath: FilePathStub({ value: '/project' }),
      });

      const quests = proxy.getAllPersistedQuests();

      expect(quests).toHaveLength(2);

      const lastQuest = proxy.getPersistedQuestAt({ index: 1 });
      const wardFailed = lastQuest.workItems.find((wi) => wi.id === workItemId);

      expect(wardFailed?.status).toBe('failed');
      expect(wardFailed?.errorMessage).toBe('ward_failed');
    });
  });

  describe('CRASH (process killed)', () => {
    it('VALID: {ward process killed, no run ID} => stores wardResult with exitCode 1 fallback', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const workItemId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({
        filesToModify: ['/project/src/modified.ts' as never],
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'ward',
        status: 'in_progress',
        spawnerType: 'command',
        attempt: 0,
        maxAttempts: 3,
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        steps: [step],
        workItems: [workItem],
      });

      const proxy = runWardLayerBrokerProxy();
      proxy.setupDeterministicUuids({
        uuids: [
          '11111111-1111-4111-8111-111111111111',
          '22222222-2222-4222-8222-222222222222',
          '33333333-3333-4333-8333-333333333333',
        ],
      });
      proxy.setupWardFailWithRetry({
        quest,
        exitCode: ExitCodeStub({ value: 1 }),
      });

      await runWardLayerBroker({
        questId,
        workItem,
        startPath: FilePathStub({ value: '/project' }),
      });

      const firstQuest = proxy.getPersistedQuestAt({ index: 0 });
      const lastWardResult = firstQuest.wardResults[firstQuest.wardResults.length - 1];

      expect(lastWardResult?.exitCode).toBe(1);

      const secondQuest = proxy.getPersistedQuestAt({ index: 1 });
      const failedWard = secondQuest.workItems.find((wi) => wi.id === workItemId);

      expect(failedWard?.status).toBe('failed');
      expect(failedWard?.errorMessage).toBe('ward_failed');
    });
  });

  describe('EXCEPTION (invalid ward output)', () => {
    it('ERROR: {wardResultJson is invalid JSON} => throws SyntaxError', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const workItemId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'ward',
        status: 'in_progress',
        spawnerType: 'command',
        maxAttempts: 3,
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [workItem],
      });

      const proxy = runWardLayerBrokerProxy();
      proxy.setupWardFailWithWardResult({
        quest,
        exitCode: ExitCodeStub({ value: 1 }),
        wardResultJson: 'invalid json{{{',
      });

      await expect(
        runWardLayerBroker({
          questId,
          workItem,
          startPath: FilePathStub({ value: '/project' }),
        }),
      ).rejects.toThrow(/Unexpected token/u);
    });
  });
});
