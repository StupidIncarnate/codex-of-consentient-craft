import {
  DependencyStepStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  RelatedDataItemStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { questPostWalkHookBroker } from './quest-post-walk-hook-broker';
import { questPostWalkHookBrokerProxy } from './quest-post-walk-hook-broker.proxy';

type PersistedQuest = ReturnType<typeof QuestStub>;

const parseLatestPersisted = (persisted: readonly unknown[]): PersistedQuest => {
  const raw = persisted[persisted.length - 1];
  const parsed: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return QuestStub(parsed as Parameters<typeof QuestStub>[0]);
};

describe('questPostWalkHookBroker', () => {
  describe('happy path', () => {
    it('VALID: {pathseeker complete + no steps + no flows} => result.success === true', async () => {
      const proxy = questPostWalkHookBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const walkId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const walkItem = WorkItemStub({
        id: walkId,
        role: 'pathseeker',
        status: 'complete',
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [walkItem],
        steps: [],
        flows: [],
      });
      proxy.setupQuest({ quest });

      const result = await questPostWalkHookBroker({
        questId,
        walkWorkItemId: walkId,
      });

      expect(result).toStrictEqual({ success: true });
    });

    it('VALID: {pathseeker + empty steps array} => still returns success (stepsToWorkItemsTransformer handles empty input)', async () => {
      const proxy = questPostWalkHookBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const walkId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const walkItem = WorkItemStub({
        id: walkId,
        role: 'pathseeker',
        status: 'complete',
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [walkItem],
        steps: [],
        flows: [],
      });
      proxy.setupQuest({ quest });

      const result = await questPostWalkHookBroker({
        questId,
        walkWorkItemId: walkId,
      });

      expect(result).toStrictEqual({ success: true });
    });
  });

  describe('guard paths', () => {
    it('ERROR: {wrong role: pathseeker-surface} => throws role-mismatch error', async () => {
      const proxy = questPostWalkHookBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const itemId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const surfaceItem = WorkItemStub({
        id: itemId,
        role: 'pathseeker-surface',
        status: 'complete',
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [surfaceItem],
      });
      proxy.setupQuest({ quest });

      await expect(
        questPostWalkHookBroker({
          questId,
          walkWorkItemId: itemId,
        }),
      ).rejects.toThrow(/Work item role is not pathseeker: pathseeker-surface/u);
    });

    it('ERROR: {pathseeker complete + unsatisfied observable} => throws post-walk completeness error', async () => {
      // The quest is always `in_progress` under the /dumpster-launch flow, so there is no
      // status transition to fire the whole-quest completeness scope. PathSeeker is the only
      // point where the plan is fully assembled, so the post-walk hook invokes the completeness
      // scope explicitly. An unsatisfied observable at this point is a real bug — throw and surface it.
      const proxy = questPostWalkHookBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const walkId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const walkItem = WorkItemStub({
        id: walkId,
        role: 'pathseeker',
        status: 'complete',
      });
      const observable = FlowObservableStub({ id: 'orphan-observable' as never });
      const node = FlowNodeStub({ id: 'login-page' as never, observables: [observable] });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [walkItem],
        steps: [],
        flows: [FlowStub({ id: 'login-flow' as never, nodes: [node] })],
      });
      proxy.setupQuest({ quest });

      await expect(
        questPostWalkHookBroker({
          questId,
          walkWorkItemId: walkId,
        }),
      ).rejects.toThrow(/Post-walk completeness validation failed/u);
    });

    it('ERROR: {workItem not in quest} => throws not-found error', async () => {
      const proxy = questPostWalkHookBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const missingId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [],
      });
      proxy.setupQuest({ quest });

      await expect(
        questPostWalkHookBroker({
          questId,
          walkWorkItemId: missingId,
        }),
      ).rejects.toThrow(/PathSeeker work item not found/u);
    });
  });

  describe('replan re-fire dedup', () => {
    it('VALID: {first generation — steps present, no complete work items} => generates full chain from all steps', async () => {
      const proxy = questPostWalkHookBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const walkId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      proxy.setupUuidQueue({
        uuids: [
          'c1c2c3c4-d5d6-4e7f-8a9b-0c1d2e3f4a5b',
          'd2d3d4d5-e6e7-4f8a-9b1c-2d3e4f5a6b7c',
          'e3e4e5e6-f7f8-4a9b-8c1d-3e4f5a6b7c8d',
          'f4f5f6f7-a8a9-4b1c-9d2e-4f5a6b7c8d9e',
          'a5a6a7a8-b9b1-4c2d-8e3f-5a6b7c8d9e0f',
        ],
      });
      const walkItem = WorkItemStub({ id: walkId, role: 'pathseeker', status: 'complete' });
      const step = DependencyStepStub({ id: 'backend-login-broker' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [walkItem],
        steps: [step],
        flows: [],
      });
      proxy.setupQuest({ quest });

      const result = await questPostWalkHookBroker({ questId, walkWorkItemId: walkId });

      expect(result).toStrictEqual({ success: true });

      // No `complete` work item covers any step, so every step regenerates — the first-generation
      // path is unchanged by the dedup guard.
      const persistedQuest = parseLatestPersisted(proxy.getAllPersistedContents());
      const generatedRoles = persistedQuest.workItems
        .filter((wi) => wi.id !== walkId)
        .map((wi) => wi.role);

      expect(generatedRoles).toStrictEqual([
        'codeweaver',
        'ward',
        'lawbringer',
        'blightwarden',
        'ward',
      ]);
    });

    it('VALID: {re-fire — every step covered by a complete codeweaver} => 0 new items (no modify write)', async () => {
      const proxy = questPostWalkHookBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const walkId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const cwId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e' });
      const walkItem = WorkItemStub({ id: walkId, role: 'pathseeker', status: 'complete' });
      const step = DependencyStepStub({ id: 'backend-login-broker' });
      const doneCw = WorkItemStub({
        id: cwId,
        role: 'codeweaver',
        status: 'complete',
        relatedDataItems: [RelatedDataItemStub({ value: 'steps/backend-login-broker' })],
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [walkItem, doneCw],
        steps: [step],
        flows: [],
      });
      proxy.setupQuest({ quest });

      const result = await questPostWalkHookBroker({ questId, walkWorkItemId: walkId });

      // Every step is covered by a `complete` codeweaver, so there is nothing to regenerate — the
      // hook short-circuits before calling questModifyBroker (no duplicate wave).
      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAllPersistedContents()).toStrictEqual([]);
    });

    it('VALID: {re-fire — 1 new step in a completed web package} => exactly 1 codeweaver for the new step + regenerated tail', async () => {
      const proxy = questPostWalkHookBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const walkId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const cwId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e' });
      proxy.setupUuidQueue({
        uuids: [
          'c1c2c3c4-d5d6-4e7f-8a9b-0c1d2e3f4a5b',
          'd2d3d4d5-e6e7-4f8a-9b1c-2d3e4f5a6b7c',
          'e3e4e5e6-f7f8-4a9b-8c1d-3e4f5a6b7c8d',
          'f4f5f6f7-a8a9-4b1c-9d2e-4f5a6b7c8d9e',
          'a5a6a7a8-b9b1-4c2d-8e3f-5a6b7c8d9e0f',
        ],
      });
      const walkItem = WorkItemStub({ id: walkId, role: 'pathseeker', status: 'complete' });
      const doneStep = DependencyStepStub({
        id: 'web-a-broker',
        slice: 'web',
        focusFile: { path: 'packages/web/src/brokers/a/a-broker.ts' },
        accompanyingFiles: [{ path: 'packages/web/src/brokers/a/a-broker.proxy.ts' }],
      });
      const newStep = DependencyStepStub({
        id: 'web-b-broker',
        slice: 'web',
        focusFile: { path: 'packages/web/src/brokers/b/b-broker.ts' },
        accompanyingFiles: [{ path: 'packages/web/src/brokers/b/b-broker.proxy.ts' }],
      });
      const doneCw = WorkItemStub({
        id: cwId,
        role: 'codeweaver',
        status: 'complete',
        relatedDataItems: [RelatedDataItemStub({ value: 'steps/web-a-broker' })],
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [walkItem, doneCw],
        steps: [doneStep, newStep],
        flows: [],
      });
      proxy.setupQuest({ quest });

      const result = await questPostWalkHookBroker({ questId, walkWorkItemId: walkId });

      expect(result).toStrictEqual({ success: true });

      const persistedQuest = parseLatestPersisted(proxy.getAllPersistedContents());
      const excludedIds = new Set([walkId, cwId]);
      const generated = persistedQuest.workItems.filter((wi) => !excludedIds.has(wi.id));
      const generatedCodeweaver = generated.find((wi) => wi.role === 'codeweaver');

      // The completed web-a-broker step is NOT re-run; only the new web-b-broker step gets a
      // codeweaver, and the tail (ward → lawbringer → blightwarden → final ward) regenerates.
      expect({
        roles: generated.map((wi) => wi.role),
        newCwRelated: generatedCodeweaver?.relatedDataItems.map((ref) => String(ref)),
      }).toStrictEqual({
        roles: ['codeweaver', 'ward', 'lawbringer', 'blightwarden', 'ward'],
        newCwRelated: ['steps/web-b-broker'],
      });
    });
  });
});
