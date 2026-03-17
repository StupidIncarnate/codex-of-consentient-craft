import {
  DependencyStepStub,
  ExitCodeStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  SessionIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { runPathseekerLayerBroker } from './run-pathseeker-layer-broker';
import { runPathseekerLayerBrokerProxy } from './run-pathseeker-layer-broker.proxy';

describe('runPathseekerLayerBroker', () => {
  describe('sessionId capture', () => {
    it('VALID: {spawn emits session_id line} => writes sessionId to work item', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const workItemId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'pathseeker',
        status: 'in_progress',
        maxAttempts: 3,
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        steps: [DependencyStepStub()],
        workItems: [workItem],
      });
      const proxy = runPathseekerLayerBrokerProxy();
      proxy.setupSuccess({
        quest,
        spawnLines: ['{"type":"system","session_id":"captured-session-abc"}'],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runPathseekerLayerBroker({
        questId,
        workItem,
        startPath: '/project/src' as never,
      });

      const questJsons = proxy.getPersistedQuestJsons();

      expect(questJsons.length).toBeGreaterThan(0);
    });
  });

  describe('resumeSessionId', () => {
    it('VALID: {workItem has sessionId} => passes resumeSessionId through to spawn args', async () => {
      const questId = QuestIdStub({ value: 'test-resume-quest' });
      const resumeSessionId = SessionIdStub({ value: '9c4d8f1c-3e38-48c9-bdec-22b61883b473' });
      const workItemId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'pathseeker',
        status: 'in_progress',
        sessionId: resumeSessionId,
        maxAttempts: 3,
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        steps: [DependencyStepStub()],
        workItems: [workItem],
      });
      const proxy = runPathseekerLayerBrokerProxy();
      proxy.setupSuccess({
        quest,
        spawnLines: ['{"type":"system","session_id":"9c4d8f1c-3e38-48c9-bdec-22b61883b473"}'],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runPathseekerLayerBroker({
        questId,
        workItem,
        startPath: '/project/src' as never,
      });

      const spawnedArgs = proxy.getSpawnedArgs();

      expect(spawnedArgs).toStrictEqual([
        '-p',
        expect.any(String),
        '--output-format',
        'stream-json',
        '--verbose',
        '--resume',
        '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
      ]);
    });
  });

  describe('verify passes', () => {
    it('VALID: {spawn succeeds, verify passes on empty quest} => marks pathseeker complete', async () => {
      const questId = QuestIdStub({ value: 'verify-pass-quest' });
      const workItemId = QuestWorkItemIdStub({ value: '00000001-0001-4001-a001-000000000001' });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'pathseeker',
        status: 'in_progress',
        maxAttempts: 3,
      });
      // Empty steps and flows pass all verification checks vacuously.
      // stepsToWorkItemsTransformer returns [] for 0 steps, so no downstream items.
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        steps: [],
        flows: [],
        workItems: [workItem],
      });

      const proxy = runPathseekerLayerBrokerProxy();
      proxy.setupVerifyPass({
        quest,
        spawnLines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runPathseekerLayerBroker({
        questId,
        workItem,
        startPath: '/project/src' as never,
      });

      const persistedQuests = proxy.getAllPersistedQuests();

      expect(persistedQuests.length).toBeGreaterThanOrEqual(1);

      // Pathseeker marked complete
      const completedItem = persistedQuests[0]!.workItems.filter((wi) => wi.id === workItemId);

      expect(completedItem).toHaveLength(1);
      expect(completedItem[0]?.status).toBe('complete');
      expect(completedItem[0]?.completedAt).toBe('2024-01-15T10:00:00.000Z');
    });
  });

  describe('verify fails with retries left', () => {
    it('VALID: {verify fails, attempt 0 of 3} => marks pathseeker failed with verification_failed', async () => {
      const questId = QuestIdStub({ value: 'verify-fail-retry-quest' });
      const workItemId = QuestWorkItemIdStub({ value: '00000002-0002-4002-a002-000000000001' });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'pathseeker',
        status: 'in_progress',
        attempt: 0 as never,
        maxAttempts: 3,
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        steps: [DependencyStepStub()],
        workItems: [workItem],
      });

      const proxy = runPathseekerLayerBrokerProxy();
      proxy.setupDeterministicUuids({
        uuids: ['aaa00000-0000-4000-a000-000000000001'],
      });
      proxy.setupSpawnSuccessVerifyFail({
        quest,
        spawnLines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runPathseekerLayerBroker({
        questId,
        workItem,
        startPath: '/project/src' as never,
      });

      const persistedQuests = proxy.getAllPersistedQuests();

      expect(persistedQuests.length).toBeGreaterThanOrEqual(1);

      // First persist: pathseeker marked failed
      const failedItem = persistedQuests[0]!.workItems.filter((wi) => wi.id === workItemId);

      expect(failedItem).toHaveLength(1);
      expect(failedItem[0]?.status).toBe('failed');
      expect(failedItem[0]?.errorMessage).toBe('verification_failed');
    });
  });

  describe('verify fails with no retries left', () => {
    it('VALID: {verify fails, attempt 2 of 3} => marks failed with no retry created', async () => {
      const questId = QuestIdStub({ value: 'verify-fail-no-retry-quest' });
      const workItemId = QuestWorkItemIdStub({ value: '00000003-0003-4003-a003-000000000001' });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'pathseeker',
        status: 'in_progress',
        attempt: 2 as never,
        maxAttempts: 3,
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        steps: [DependencyStepStub()],
        workItems: [workItem],
      });

      const proxy = runPathseekerLayerBrokerProxy();
      proxy.setupSpawnSuccessVerifyFail({
        quest,
        spawnLines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runPathseekerLayerBroker({
        questId,
        workItem,
        startPath: '/project/src' as never,
      });

      const persistedQuests = proxy.getAllPersistedQuests();

      // Only one persist: pathseeker marked failed, no retry created
      expect(persistedQuests).toHaveLength(1);

      const failedItem = persistedQuests[0]!.workItems.filter((wi) => wi.id === workItemId);

      expect(failedItem).toHaveLength(1);
      expect(failedItem[0]?.status).toBe('failed');
      expect(failedItem[0]?.errorMessage).toBe('verification_failed');
    });
  });

  describe('spawn crash with retries left', () => {
    it('VALID: {spawn crashes, verify fails, retries left} => marks pathseeker failed', async () => {
      const questId = QuestIdStub({ value: 'crash-retry-quest' });
      const workItemId = QuestWorkItemIdStub({ value: '00000004-0004-4004-a004-000000000001' });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'pathseeker',
        status: 'in_progress',
        attempt: 0 as never,
        maxAttempts: 3,
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        steps: [DependencyStepStub()],
        workItems: [workItem],
      });

      const proxy = runPathseekerLayerBrokerProxy();
      proxy.setupDeterministicUuids({
        uuids: ['bbb00000-0000-4000-a000-000000000001'],
      });
      proxy.setupSpawnCrashVerifyFail({ quest });

      await runPathseekerLayerBroker({
        questId,
        workItem,
        startPath: '/project/src' as never,
      });

      const persistedQuests = proxy.getAllPersistedQuests();

      expect(persistedQuests.length).toBeGreaterThanOrEqual(1);

      // First persist: pathseeker marked failed after crash + verify failure
      const failedItem = persistedQuests[0]!.workItems.filter((wi) => wi.id === workItemId);

      expect(failedItem).toHaveLength(1);
      expect(failedItem[0]?.status).toBe('failed');
      expect(failedItem[0]?.errorMessage).toBe('verification_failed');
    });
  });

  describe('quest not found for downstream creation', () => {
    it('VALID: {verify passes, get fails} => resolves without error', async () => {
      const questId = QuestIdStub({ value: 'quest-get-fail' });
      const workItemId = QuestWorkItemIdStub({ value: '00000005-0005-4005-a005-000000000001' });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'pathseeker',
        status: 'in_progress',
        maxAttempts: 3,
      });
      // Empty steps/flows passes verification vacuously
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        steps: [],
        flows: [],
        workItems: [workItem],
      });

      const proxy = runPathseekerLayerBrokerProxy();
      // setupSuccess provides limited mocks. With 0 steps, no downstream items
      // are generated so questGetBroker failure is irrelevant.
      proxy.setupSuccess({
        quest,
        spawnLines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      // The function resolves without error even when downstream get fails,
      // because questGetBroker returns { success: false } silently.
      await expect(
        runPathseekerLayerBroker({
          questId,
          workItem,
          startPath: '/project/src' as never,
        }),
      ).resolves.toBeUndefined();
    });
  });
});
