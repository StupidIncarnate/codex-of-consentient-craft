import {
  ExitCodeStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { runWardLayerBroker } from './run-ward-layer-broker';
import { runWardLayerBrokerProxy } from './run-ward-layer-broker.proxy';

const WARD_JSON_WITH_FILES = JSON.stringify({
  checks: [
    {
      projectResults: [
        {
          errors: [{ filePath: '/project/src/foo.ts' }],
          testFailures: [],
        },
      ],
    },
  ],
});

const WARD_ID = 'a1a1a1a1-b2b2-c3c3-d4d4-e5e5e5e5e5e5';
const SIEGE_ID = 'b1b1b1b1-c2c2-d3d3-e4e4-f5f5f5f5f5f5';
const LAWBRINGER_ID = 'c1c1c1c1-d2d2-e3e3-f4f4-a5a5a5a5a5a5';

describe('runWardLayerBroker', () => {
  describe('export', () => {
    it('VALID: {module} => exports a function', () => {
      expect(typeof runWardLayerBroker).toBe('function');
    });
  });

  describe('PASS (exit code 0)', () => {
    it('VALID: {exitCode 0} => ward marked complete', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const workItemId = QuestWorkItemIdStub({ value: WARD_ID });
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
        startPath: '/project' as never,
      });

      const status = proxy.getPersistedWorkItemStatus({ workItemId });

      expect(status).toBe('complete');
    });
  });

  describe('FAIL (retries left, filePaths present)', () => {
    it('VALID: {exitCode 1, attempt 0, maxAttempts 3, filePaths} => ward failed and wardResult stored', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const wardItemId = QuestWorkItemIdStub({ value: WARD_ID });
      const siegeItemId = QuestWorkItemIdStub({ value: SIEGE_ID });
      const wardItem = WorkItemStub({
        id: wardItemId,
        role: 'ward',
        status: 'in_progress',
        spawnerType: 'command',
        maxAttempts: 3,
      });
      const siegeItem = WorkItemStub({
        id: siegeItemId,
        role: 'siegemaster',
        status: 'pending',
        dependsOn: [wardItemId],
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [wardItem, siegeItem],
      });
      const proxy = runWardLayerBrokerProxy();
      proxy.setupWardFail({
        quest,
        exitCode: ExitCodeStub({ value: 1 }),
        wardResultJson: WARD_JSON_WITH_FILES,
      });

      await runWardLayerBroker({
        questId,
        workItem: wardItem,
        startPath: '/project' as never,
      });

      const wardStatus = proxy.getPersistedWorkItemStatus({ workItemId: wardItemId });

      expect(wardStatus).toBe('failed');

      const wardResultExitCode = proxy.getPersistedWardResultExitCode();

      expect(wardResultExitCode).toBe(1);
    });
  });

  describe('FAIL (retries left, no filePaths) ward retry and siege dependsOn assertions', () => {
    it('VALID: {exitCode 1, no filePaths} => ward-retry dependsOn is empty array and siege depends on ward-retry via replacement', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const wardItemId = QuestWorkItemIdStub({ value: WARD_ID });
      const siegeItemId = QuestWorkItemIdStub({ value: SIEGE_ID });
      const wardItem = WorkItemStub({
        id: wardItemId,
        role: 'ward',
        status: 'in_progress',
        spawnerType: 'command',
        maxAttempts: 3,
      });
      const siegeItem = WorkItemStub({
        id: siegeItemId,
        role: 'siegemaster',
        status: 'pending',
        dependsOn: [wardItemId],
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [wardItem, siegeItem],
      });
      const proxy = runWardLayerBrokerProxy();
      proxy.setupWardFailNoFilePaths({
        quest,
        exitCode: ExitCodeStub({ value: 1 }),
      });

      await runWardLayerBroker({
        questId,
        workItem: wardItem,
        startPath: '/project' as never,
      });

      const inserted = proxy.getInsertedWorkItems();
      const wardRetries = inserted.filter((w) => w.attempt === 1);
      const siegeItems = inserted.filter((w) => w.role === 'siegemaster');

      expect(wardRetries).toHaveLength(1);
      expect(wardRetries[0]?.role).toBe('ward');
      expect(wardRetries[0]?.insertedBy).toBe(wardItemId);

      expect(siegeItems).toHaveLength(1);
      expect(siegeItems[0]?.dependsOn).toStrictEqual([wardRetries[0]?.id]);
    });
  });

  describe('FAIL (retries left, no filePaths)', () => {
    it('VALID: {exitCode 1, no filePaths} => ward-retry created with no spiritmender', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const wardItemId = QuestWorkItemIdStub({ value: WARD_ID });
      const siegeItemId = QuestWorkItemIdStub({ value: SIEGE_ID });
      const wardItem = WorkItemStub({
        id: wardItemId,
        role: 'ward',
        status: 'in_progress',
        spawnerType: 'command',
        maxAttempts: 3,
      });
      const siegeItem = WorkItemStub({
        id: siegeItemId,
        role: 'siegemaster',
        status: 'pending',
        dependsOn: [wardItemId],
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [wardItem, siegeItem],
      });
      const proxy = runWardLayerBrokerProxy();
      proxy.setupWardFailNoFilePaths({
        quest,
        exitCode: ExitCodeStub({ value: 1 }),
      });

      await runWardLayerBroker({
        questId,
        workItem: wardItem,
        startPath: '/project' as never,
      });

      const inserted = proxy.getInsertedWorkItems();
      const roles = inserted.map((w) => w.role).sort();

      // Original ward + siege + ward-retry = 3 (no spiritmender)
      expect(inserted).toHaveLength(3);
      expect(roles).toStrictEqual(['siegemaster', 'ward', 'ward']);
    });
  });

  describe('FAIL (no retries left) pending items skipped', () => {
    it('VALID: {attempt 2, maxAttempts 3} => ward failed and pending items skipped', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const wardItemId = QuestWorkItemIdStub({ value: WARD_ID });
      const siegeItemId = QuestWorkItemIdStub({ value: SIEGE_ID });
      const lawbringerItemId = QuestWorkItemIdStub({ value: LAWBRINGER_ID });
      const wardItem = WorkItemStub({
        id: wardItemId,
        role: 'ward',
        status: 'in_progress',
        spawnerType: 'command',
        attempt: 2 as never,
        maxAttempts: 3,
      });
      const siegeItem = WorkItemStub({
        id: siegeItemId,
        role: 'siegemaster',
        status: 'pending',
        dependsOn: [wardItemId],
      });
      const lawbringerItem = WorkItemStub({
        id: lawbringerItemId,
        role: 'lawbringer',
        status: 'pending',
        dependsOn: [siegeItemId],
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [wardItem, siegeItem, lawbringerItem],
      });
      const proxy = runWardLayerBrokerProxy();
      proxy.setupWardFailRetryExhausted({
        quest,
        exitCode: ExitCodeStub({ value: 1 }),
        wardResultJson: WARD_JSON_WITH_FILES,
      });

      await runWardLayerBroker({
        questId,
        workItem: wardItem,
        startPath: '/project' as never,
      });

      const wardStatus = proxy.getPersistedWorkItemStatus({ workItemId: wardItemId });

      expect(wardStatus).toBe('failed');

      const skippedIds = proxy.getSkippedWorkItemIds();

      expect(skippedIds).toStrictEqual([siegeItemId, lawbringerItemId]);
    });
  });

  describe('FAIL (no retries left) pathseeker replan created', () => {
    it('VALID: {attempt 2, maxAttempts 3} => pathseeker replan inserted', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const wardItemId = QuestWorkItemIdStub({ value: WARD_ID });
      const siegeItemId = QuestWorkItemIdStub({ value: SIEGE_ID });
      const wardItem = WorkItemStub({
        id: wardItemId,
        role: 'ward',
        status: 'in_progress',
        spawnerType: 'command',
        attempt: 2 as never,
        maxAttempts: 3,
      });
      const siegeItem = WorkItemStub({
        id: siegeItemId,
        role: 'siegemaster',
        status: 'pending',
        dependsOn: [wardItemId],
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [wardItem, siegeItem],
      });
      const proxy = runWardLayerBrokerProxy();
      proxy.setupWardFailRetryExhausted({
        quest,
        exitCode: ExitCodeStub({ value: 1 }),
        wardResultJson: WARD_JSON_WITH_FILES,
      });

      await runWardLayerBroker({
        questId,
        workItem: wardItem,
        startPath: '/project' as never,
      });

      const inserted = proxy.getInsertedWorkItems();
      const pathseekerItems = inserted.filter((w) => w.role === 'pathseeker');

      expect(pathseekerItems).toHaveLength(1);

      const [pathseeker] = pathseekerItems;

      expect(pathseeker).toBeDefined();
      expect(pathseeker?.status).toBe('pending');
      expect(pathseeker?.dependsOn).toStrictEqual([wardItem.id]);
    });
  });

  describe('CRASH (exitCode null)', () => {
    it('VALID: {exitCode null} => treated as failure, wardResult exitCode fallback to 1', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const wardItemId = QuestWorkItemIdStub({ value: WARD_ID });
      const wardItem = WorkItemStub({
        id: wardItemId,
        role: 'ward',
        status: 'in_progress',
        spawnerType: 'command',
        maxAttempts: 3,
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [wardItem],
      });
      const proxy = runWardLayerBrokerProxy();
      proxy.setupWardFailNullExit({ quest });

      await runWardLayerBroker({
        questId,
        workItem: wardItem,
        startPath: '/project' as never,
      });

      const exitCode = proxy.getPersistedWardResultExitCode();

      expect(exitCode).toBe(1);

      const wardStatus = proxy.getPersistedWorkItemStatus({ workItemId: wardItemId });

      expect(wardStatus).toBe('failed');
    });
  });

  describe('EXCEPTION (quest get silently fails during retry insert)', () => {
    it('VALID: {ward fails, quest get returns not found for insert} => ward still marked failed', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const wardItemId = QuestWorkItemIdStub({ value: WARD_ID });
      const wardItem = WorkItemStub({
        id: wardItemId,
        role: 'ward',
        status: 'in_progress',
        spawnerType: 'command',
        maxAttempts: 3,
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [wardItem],
      });
      const proxy = runWardLayerBrokerProxy();
      proxy.setupWardFailNoFilePaths({
        quest,
        exitCode: ExitCodeStub({ value: 1 }),
      });

      await runWardLayerBroker({
        questId,
        workItem: wardItem,
        startPath: '/project' as never,
      });

      const wardStatus = proxy.getPersistedWorkItemStatus({ workItemId: wardItemId });

      expect(wardStatus).toBe('failed');
    });
  });
});
