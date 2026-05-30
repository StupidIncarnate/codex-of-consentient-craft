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
