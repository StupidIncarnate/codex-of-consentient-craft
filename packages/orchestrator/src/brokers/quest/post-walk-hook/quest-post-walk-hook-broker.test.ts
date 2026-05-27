import {
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  FolderTypeGroupsStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { questPostWalkHookBroker } from './quest-post-walk-hook-broker';
import { questPostWalkHookBrokerProxy } from './quest-post-walk-hook-broker.proxy';

describe('questPostWalkHookBroker', () => {
  describe('happy path', () => {
    it('VALID: {pathseeker-walk complete + no steps + no flows} => result.success === true', async () => {
      const proxy = questPostWalkHookBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const walkId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const walkItem = WorkItemStub({
        id: walkId,
        role: 'pathseeker-walk',
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
        batchGroups: FolderTypeGroupsStub({ value: [] }),
      });

      expect(result).toStrictEqual({ success: true });
    });

    it('VALID: {pathseeker-walk + empty steps array} => still returns success (stepsToWorkItemsTransformer handles empty input)', async () => {
      const proxy = questPostWalkHookBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const walkId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const walkItem = WorkItemStub({
        id: walkId,
        role: 'pathseeker-walk',
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
        batchGroups: FolderTypeGroupsStub({ value: [] }),
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
          batchGroups: FolderTypeGroupsStub({ value: [] }),
        }),
      ).rejects.toThrow(/Work item role is not pathseeker-walk: pathseeker-surface/u);
    });

    it('ERROR: {pathseeker-walk complete + unsatisfied observable} => throws post-walk completeness error', async () => {
      // The completeness scope used to fire at the seek_walk → in_progress status hop
      // inside questSaveInvariantsTransformer. Under the /dumpster-launch flow that
      // hop now fires BEFORE pathseeker-walk runs, so the post-walk hook MUST invoke
      // the completeness scope explicitly. An unsatisfied observable at this point
      // (the plan is fully assembled) is a real bug — throw and surface the failure.
      const proxy = questPostWalkHookBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const walkId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const walkItem = WorkItemStub({
        id: walkId,
        role: 'pathseeker-walk',
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
          batchGroups: FolderTypeGroupsStub({ value: [] }),
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
          batchGroups: FolderTypeGroupsStub({ value: [] }),
        }),
      ).rejects.toThrow(/Walk work item not found/u);
    });
  });
});
