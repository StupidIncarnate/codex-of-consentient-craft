import {
  ExitCodeStub,
  FileNameStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { questRunWardBroker } from './quest-run-ward-broker';
import { questRunWardBrokerProxy } from './quest-run-ward-broker.proxy';

const WARD_WORK_ITEM_ID = 'a1a1a1a1-b2b2-c3c3-d4d4-e5e5e5e5e5e5';
const SIEGE_WORK_ITEM_ID = 'b2b2b2b2-c3c3-d4d4-e5e5-f6f6f6f6f6f6';

// The proxy pins crypto.randomUUID to a deterministic sequence: call #0 = wardResultId
// (FIXED_WARD_RESULT_UUID, ...f0f0), call #1 = the spliced spiritmender id (...f001),
// call #2 = the spliced ward-retry id (...f002).
const SPLICED_SPIRITMENDER_ID = QuestWorkItemIdStub({
  value: 'f0f0f0f0-f0f0-4f0f-bf0f-f0f0f0f0f001',
});
const SPLICED_WARD_RETRY_ID = QuestWorkItemIdStub({
  value: 'f0f0f0f0-f0f0-4f0f-bf0f-f0f0f0f0f002',
});

const ATTEMPT_ONE = 1;
const MAX_ATTEMPTS_THREE = 3;

describe('questRunWardBroker', () => {
  describe('export', () => {
    it('VALID: {module} => exports a function', () => {
      expect(questRunWardBroker).toStrictEqual(expect.any(Function));
    });
  });

  describe('mode: changed', () => {
    it('VALID: {exitCode 0, runId, mode: changed} => work item marked complete, lastWardRunId persisted, full result returned', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const workItemId = QuestWorkItemIdStub({ value: WARD_WORK_ITEM_ID });
      const runId = FileNameStub({ value: '1739625600000-a3f1' });
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
      const proxy = questRunWardBrokerProxy();
      proxy.setupWardPass({ quest, runId });

      const result = await questRunWardBroker({ questId, workItemId, mode: 'changed' });

      expect(result).toStrictEqual({
        success: true,
        questId,
        workItemId,
        exitCode: ExitCodeStub({ value: 0 }),
        wardResultId: proxy.getFixedWardResultId(),
        lastWardRunId: runId,
      });
      expect(proxy.getPersistedWorkItemStatus({ workItemId })).toBe('complete');
      expect(proxy.getPersistedLastWardRunId({ workItemId })).toBe(runId);
      expect(proxy.getPersistedWardResultExitCode()).toBe(ExitCodeStub({ value: 0 }));
      expect(proxy.getPersistedWardModes()).toStrictEqual(['changed']);
    });

    it('VALID: {mode: changed} => spawn invoked with [run, --changed]', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const workItemId = QuestWorkItemIdStub({ value: WARD_WORK_ITEM_ID });
      const runId = FileNameStub({ value: '1739625600000-a3f1' });
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
      const proxy = questRunWardBrokerProxy();
      proxy.setupWardPass({ quest, runId });

      await questRunWardBroker({ questId, workItemId, mode: 'changed' });

      expect(proxy.getSpawnedArgs()).toStrictEqual(['run', '--changed']);
    });
  });

  describe('mode: full', () => {
    it('VALID: {exitCode 0, runId, mode: full} => work item marked complete, wardResult.wardMode === full', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const workItemId = QuestWorkItemIdStub({ value: WARD_WORK_ITEM_ID });
      const runId = FileNameStub({ value: '1739625600000-bbbb' });
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
      const proxy = questRunWardBrokerProxy();
      proxy.setupWardPass({ quest, runId });

      const result = await questRunWardBroker({ questId, workItemId, mode: 'full' });

      expect(result).toStrictEqual({
        success: true,
        questId,
        workItemId,
        exitCode: ExitCodeStub({ value: 0 }),
        wardResultId: proxy.getFixedWardResultId(),
        lastWardRunId: runId,
      });
      expect(proxy.getPersistedWorkItemStatus({ workItemId })).toBe('complete');
      expect(proxy.getPersistedLastWardRunId({ workItemId })).toBe(runId);
      expect(proxy.getPersistedWardModes()).toStrictEqual(['full']);
    });

    it('VALID: {mode: full} => spawn invoked with [run] only', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const workItemId = QuestWorkItemIdStub({ value: WARD_WORK_ITEM_ID });
      const runId = FileNameStub({ value: '1739625600000-bbbb' });
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
      const proxy = questRunWardBrokerProxy();
      proxy.setupWardPass({ quest, runId });

      await questRunWardBroker({ questId, workItemId, mode: 'full' });

      expect(proxy.getSpawnedArgs()).toStrictEqual(['run']);
    });
  });

  describe('failure path', () => {
    it('VALID: {exitCode 1, runId} => work item marked failed, lastWardRunId still persisted', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const workItemId = QuestWorkItemIdStub({ value: WARD_WORK_ITEM_ID });
      const runId = FileNameStub({ value: '1739625600000-cccc' });
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
      const proxy = questRunWardBrokerProxy();
      proxy.setupWardFail({ quest, exitCode: ExitCodeStub({ value: 1 }), runId });

      const result = await questRunWardBroker({ questId, workItemId, mode: 'changed' });

      expect(result).toStrictEqual({
        success: true,
        questId,
        workItemId,
        exitCode: ExitCodeStub({ value: 1 }),
        wardResultId: proxy.getFixedWardResultId(),
        lastWardRunId: runId,
      });
      expect(proxy.getPersistedWorkItemStatus({ workItemId })).toBe('failed');
      expect(proxy.getPersistedLastWardRunId({ workItemId })).toBe(runId);
      expect(proxy.getPersistedWardResultExitCode()).toBe(ExitCodeStub({ value: 1 }));
      // The wardResult must be linked back to the work item via relatedDataItems —
      // the execution panel resolves a row's ward results ONLY through this ref. Without
      // it the [WARD] row shows "ward_failed" but never the exit code / detail.
      expect(proxy.getPersistedWorkItemRelatedDataItems({ workItemId })).toStrictEqual([
        `wardResults/${proxy.getFixedWardResultId()}`,
      ]);
    });
  });

  describe('failure recovery — RECOVER path (retries remain)', () => {
    it('VALID: {exitCode 1, attempt 0 of 3} => ward item marked failed before recovery routing', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const workItemId = QuestWorkItemIdStub({ value: WARD_WORK_ITEM_ID });
      const runId = FileNameStub({ value: '1739625600000-aaa1' });
      const wardItem = WorkItemStub({
        id: workItemId,
        role: 'ward',
        status: 'in_progress',
        spawnerType: 'command',
        attempt: 0,
        maxAttempts: 3,
        wardMode: 'changed',
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [wardItem],
      });
      const proxy = questRunWardBrokerProxy();
      proxy.setupWardFail({ quest, exitCode: ExitCodeStub({ value: 1 }), runId });

      await questRunWardBroker({ questId, workItemId, mode: 'changed' });

      expect(proxy.getPersistedWorkItemStatus({ workItemId })).toBe('failed');
    });

    it('VALID: {exitCode 1, detail blob with 1 file} => exactly one spiritmender spliced (dependsOn ward, insertedBy ward)', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const workItemId = QuestWorkItemIdStub({ value: WARD_WORK_ITEM_ID });
      const runId = FileNameStub({ value: '1739625600000-aaa1' });
      const wardItem = WorkItemStub({
        id: workItemId,
        role: 'ward',
        status: 'in_progress',
        spawnerType: 'command',
        attempt: 0,
        maxAttempts: 3,
        wardMode: 'changed',
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [wardItem],
      });
      const proxy = questRunWardBrokerProxy();
      proxy.setupWardFail({ quest, exitCode: ExitCodeStub({ value: 1 }), runId });

      await questRunWardBroker({ questId, workItemId, mode: 'changed' });

      // The detail blob carries one file → one batch (batchSize 3) → exactly one spiritmender.
      const spiritmenders = proxy
        .getFinalPersistedWorkItems()
        .filter((item) => item.role === 'spiritmender');

      expect(spiritmenders).toStrictEqual([
        WorkItemStub({
          id: SPLICED_SPIRITMENDER_ID,
          role: 'spiritmender',
          status: 'pending',
          spawnerType: 'agent',
          dependsOn: [workItemId],
          maxAttempts: 1,
          createdAt: '2024-01-15T10:00:00.000Z',
          insertedBy: workItemId,
        }),
      ]);
    });

    it('VALID: {exitCode 1, retries remain} => exactly one ward-retry spliced (attempt 1, dependsOn spiritmender, same wardMode, insertedBy ward)', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const workItemId = QuestWorkItemIdStub({ value: WARD_WORK_ITEM_ID });
      const runId = FileNameStub({ value: '1739625600000-aaa1' });
      const wardItem = WorkItemStub({
        id: workItemId,
        role: 'ward',
        status: 'in_progress',
        spawnerType: 'command',
        attempt: 0,
        maxAttempts: 3,
        wardMode: 'changed',
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [wardItem],
      });
      const proxy = questRunWardBrokerProxy();
      proxy.setupWardFail({ quest, exitCode: ExitCodeStub({ value: 1 }), runId });

      await questRunWardBroker({ questId, workItemId, mode: 'changed' });

      // The spliced ward-retry is uniquely keyed by SPLICED_WARD_RETRY_ID; assert its exact shape.
      const retries = proxy
        .getFinalPersistedWorkItems()
        .filter((item) => item.id === SPLICED_WARD_RETRY_ID);

      expect(retries).toStrictEqual([
        WorkItemStub({
          id: SPLICED_WARD_RETRY_ID,
          role: 'ward',
          status: 'pending',
          spawnerType: 'command',
          dependsOn: [SPLICED_SPIRITMENDER_ID],
          attempt: ATTEMPT_ONE,
          maxAttempts: MAX_ATTEMPTS_THREE,
          createdAt: '2024-01-15T10:00:00.000Z',
          insertedBy: workItemId,
          wardMode: 'changed',
        }),
      ]);
    });

    it('VALID: {downstream siegemaster dependsOn ward} => rewired to dependsOn ward-retry (replacementMapping wardId→retryId)', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const workItemId = QuestWorkItemIdStub({ value: WARD_WORK_ITEM_ID });
      const siegeId = QuestWorkItemIdStub({ value: SIEGE_WORK_ITEM_ID });
      const runId = FileNameStub({ value: '1739625600000-aaa2' });
      const wardItem = WorkItemStub({
        id: workItemId,
        role: 'ward',
        status: 'in_progress',
        spawnerType: 'command',
        attempt: 0,
        maxAttempts: 3,
        wardMode: 'changed',
      });
      const siegeItem = WorkItemStub({
        id: siegeId,
        role: 'siegemaster',
        status: 'pending',
        spawnerType: 'agent',
        dependsOn: [workItemId],
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [wardItem, siegeItem],
      });
      const proxy = questRunWardBrokerProxy();
      proxy.setupWardFail({ quest, exitCode: ExitCodeStub({ value: 1 }), runId });

      await questRunWardBroker({ questId, workItemId, mode: 'changed' });

      const finalItems = proxy.getFinalPersistedWorkItems();
      const persistedSiege = finalItems.find((item) => item.id === siegeId);

      // Downstream siegemaster no longer depends on the failed ward — it depends on the retry.
      expect(persistedSiege?.dependsOn).toStrictEqual([SPLICED_WARD_RETRY_ID]);
    });

    it('VALID: {exitCode 1, retries remain} => MCP return contract unchanged (same shape as happy path)', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const workItemId = QuestWorkItemIdStub({ value: WARD_WORK_ITEM_ID });
      const runId = FileNameStub({ value: '1739625600000-aaa3' });
      const wardItem = WorkItemStub({
        id: workItemId,
        role: 'ward',
        status: 'in_progress',
        spawnerType: 'command',
        attempt: 0,
        maxAttempts: 3,
        wardMode: 'changed',
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [wardItem],
      });
      const proxy = questRunWardBrokerProxy();
      proxy.setupWardFail({ quest, exitCode: ExitCodeStub({ value: 1 }), runId });

      const result = await questRunWardBroker({ questId, workItemId, mode: 'changed' });

      expect(result).toStrictEqual({
        success: true,
        questId,
        workItemId,
        exitCode: ExitCodeStub({ value: 1 }),
        wardResultId: proxy.getFixedWardResultId(),
        lastWardRunId: runId,
      });
    });
  });

  describe('failure recovery — EXHAUSTION path (retries exhausted)', () => {
    it('VALID: {exitCode 1, attempt 2 of 3 (last)} => quest blocked, pending items skipped, no spiritmender/retry spliced', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const workItemId = QuestWorkItemIdStub({ value: WARD_WORK_ITEM_ID });
      const siegeId = QuestWorkItemIdStub({ value: SIEGE_WORK_ITEM_ID });
      const runId = FileNameStub({ value: '1739625600000-bbb1' });
      const wardItem = WorkItemStub({
        id: workItemId,
        role: 'ward',
        status: 'in_progress',
        spawnerType: 'command',
        attempt: 2,
        maxAttempts: 3,
        wardMode: 'changed',
      });
      const pendingSiege = WorkItemStub({
        id: siegeId,
        role: 'siegemaster',
        status: 'pending',
        spawnerType: 'agent',
        dependsOn: [workItemId],
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [wardItem, pendingSiege],
      });
      const proxy = questRunWardBrokerProxy();
      proxy.setupWardFailExhausted({ quest, exitCode: ExitCodeStub({ value: 1 }), runId });

      await questRunWardBroker({ questId, workItemId, mode: 'changed' });

      // Quest is blocked.
      expect(proxy.getFinalPersistedQuestStatus()).toBe('blocked');
    });

    it('VALID: {exitCode 1, retries exhausted, pending siegemaster} => failed ward + skipped siege, nothing spliced', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const workItemId = QuestWorkItemIdStub({ value: WARD_WORK_ITEM_ID });
      const siegeId = QuestWorkItemIdStub({ value: SIEGE_WORK_ITEM_ID });
      const runId = FileNameStub({ value: '1739625600000-bbb1' });
      const wardItem = WorkItemStub({
        id: workItemId,
        role: 'ward',
        status: 'in_progress',
        spawnerType: 'command',
        attempt: 2,
        maxAttempts: 3,
        wardMode: 'changed',
      });
      const pendingSiege = WorkItemStub({
        id: siegeId,
        role: 'siegemaster',
        status: 'pending',
        spawnerType: 'agent',
        dependsOn: [workItemId],
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [wardItem, pendingSiege],
      });
      const proxy = questRunWardBrokerProxy();
      proxy.setupWardFailExhausted({ quest, exitCode: ExitCodeStub({ value: 1 }), runId });

      await questRunWardBroker({ questId, workItemId, mode: 'changed' });

      // Exact final work-item set: the original ward (now failed) + the original siege (now skipped).
      // No spiritmender / ward-retry was spliced — the complete array proves it.
      expect(proxy.getFinalPersistedWorkItems()).toStrictEqual([
        WorkItemStub({
          id: workItemId,
          role: 'ward',
          status: 'failed',
          spawnerType: 'command',
          attempt: 2,
          maxAttempts: 3,
          wardMode: 'changed',
        }),
        WorkItemStub({
          id: siegeId,
          role: 'siegemaster',
          status: 'skipped',
          spawnerType: 'agent',
          dependsOn: [workItemId],
        }),
      ]);
    });

    it('VALID: {exitCode 1, retries exhausted} => MCP return contract unchanged (same shape as happy path)', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const workItemId = QuestWorkItemIdStub({ value: WARD_WORK_ITEM_ID });
      const runId = FileNameStub({ value: '1739625600000-bbb2' });
      const wardItem = WorkItemStub({
        id: workItemId,
        role: 'ward',
        status: 'in_progress',
        spawnerType: 'command',
        attempt: 2,
        maxAttempts: 3,
        wardMode: 'changed',
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [wardItem],
      });
      const proxy = questRunWardBrokerProxy();
      proxy.setupWardFailExhausted({ quest, exitCode: ExitCodeStub({ value: 1 }), runId });

      const result = await questRunWardBroker({ questId, workItemId, mode: 'changed' });

      expect(result).toStrictEqual({
        success: true,
        questId,
        workItemId,
        exitCode: ExitCodeStub({ value: 1 }),
        wardResultId: proxy.getFixedWardResultId(),
        lastWardRunId: runId,
      });
    });
  });

  describe('crash path (no runId in stdout)', () => {
    it('VALID: {exitCode 1, no runId} => work item marked failed without lastWardRunId', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const workItemId = QuestWorkItemIdStub({ value: WARD_WORK_ITEM_ID });
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
      const proxy = questRunWardBrokerProxy();
      proxy.setupWardCrash({ quest, exitCode: ExitCodeStub({ value: 1 }) });

      const result = await questRunWardBroker({ questId, workItemId, mode: 'changed' });

      expect(result).toStrictEqual({
        success: true,
        questId,
        workItemId,
        exitCode: ExitCodeStub({ value: 1 }),
        wardResultId: proxy.getFixedWardResultId(),
      });
      expect(proxy.getPersistedWorkItemStatus({ workItemId })).toBe('failed');
      expect(proxy.getPersistedLastWardRunId({ workItemId })).toBe(undefined);
    });
  });
});
