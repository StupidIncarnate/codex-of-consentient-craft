import {
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { slotManagerStatics } from '../../../statics/slot-manager/slot-manager-statics';
import { questSplicePathseekerReplanBroker } from './quest-splice-pathseeker-replan-broker';
import { questSplicePathseekerReplanBrokerProxy } from './quest-splice-pathseeker-replan-broker.proxy';

const QUEST_ID = QuestIdStub({ value: 'add-auth' });
const FAILED_ID = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
const PENDING_ID = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e' });

describe('questSplicePathseekerReplanBroker', () => {
  describe('budget remaining => REPLAN', () => {
    it('VALID: {failed item + pending downstream} => marks failed, skips pending, splices pathseeker replan, quest stays in_progress', async () => {
      const proxy = questSplicePathseekerReplanBrokerProxy();
      const failedItem = WorkItemStub({ id: FAILED_ID, role: 'codeweaver', status: 'in_progress' });
      const pendingItem = WorkItemStub({
        id: PENDING_ID,
        role: 'ward',
        status: 'pending',
        spawnerType: 'command',
        dependsOn: [FAILED_ID],
        wardMode: 'full',
      });
      const quest = QuestStub({
        id: QUEST_ID,
        status: 'in_progress',
        workItems: [failedItem, pendingItem],
      });
      proxy.setupReplan({ quest });

      const result = await questSplicePathseekerReplanBroker({
        questId: QUEST_ID,
        failedWorkItemId: FAILED_ID,
        actualSignal: 'failed-replan',
      });

      const persisted = proxy.getLastPersistedQuest();
      const failed = persisted.workItems.find((wi) => wi.id === FAILED_ID);
      const pending = persisted.workItems.find((wi) => wi.id === PENDING_ID);
      const replan = persisted.workItems.find((wi) => wi.role === 'pathseeker');

      expect({
        replanned: result.replanned,
        blocked: result.blocked,
        failedStatus: failed?.status,
        failedActualSignal: failed?.actualSignal,
        pendingStatus: pending?.status,
        replanStatus: replan?.status,
        replanInsertedBy: replan?.insertedBy,
        replanDependsOn: replan?.dependsOn,
        questStatus: persisted.status,
      }).toStrictEqual({
        replanned: true,
        blocked: false,
        failedStatus: 'failed',
        failedActualSignal: 'failed-replan',
        pendingStatus: 'skipped',
        replanStatus: 'pending',
        replanInsertedBy: FAILED_ID,
        replanDependsOn: [],
        questStatus: 'in_progress',
      });
    });

    it('VALID: {brief provided} => brief threaded onto replan pathseeker summary AND failed errorMessage', async () => {
      const proxy = questSplicePathseekerReplanBrokerProxy();
      const failedItem = WorkItemStub({ id: FAILED_ID, role: 'codeweaver', status: 'in_progress' });
      const quest = QuestStub({ id: QUEST_ID, status: 'in_progress', workItems: [failedItem] });
      proxy.setupReplan({ quest });
      const { summary: brief } = WorkItemStub({
        summary: 'CLI slice needs ink; not installed + forbidden by widgets allowlist',
      });

      await questSplicePathseekerReplanBroker({
        questId: QUEST_ID,
        failedWorkItemId: FAILED_ID,
        brief,
      });

      const persisted = proxy.getLastPersistedQuest();
      const failed = persisted.workItems.find((wi) => wi.id === FAILED_ID);
      const replan = persisted.workItems.find((wi) => wi.role === 'pathseeker');

      expect({
        replanSummary: String(replan?.summary),
        failedErrorMessage: String(failed?.errorMessage),
      }).toStrictEqual({
        replanSummary: 'CLI slice needs ink; not installed + forbidden by widgets allowlist',
        failedErrorMessage: 'CLI slice needs ink; not installed + forbidden by widgets allowlist',
      });
    });
  });

  describe('budget exhausted => BLOCK (the sole block path)', () => {
    it('VALID: {replanMaxCycles pathseeker replans already exist} => BLOCKS, drains pending, splices no further replan', async () => {
      const proxy = questSplicePathseekerReplanBrokerProxy();
      // Each prior replan was inserted by a DIFFERENT earlier failure (distinct insertedBy), so the
      // idempotency guard (a replan already inserted by THIS item) does not fire — the broker reaches
      // the budget check and blocks.
      const priorReplans = Array.from(
        { length: slotManagerStatics.pathseeker.replanMaxCycles },
        (_, i) =>
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: `c${String(i)}c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e` }),
            role: 'pathseeker',
            status: 'complete',
            insertedBy: QuestWorkItemIdStub({
              value: `dead000${String(i)}-1111-4222-9333-444444444444`,
            }),
          }),
      );
      const failedItem = WorkItemStub({ id: FAILED_ID, role: 'codeweaver', status: 'in_progress' });
      const pendingItem = WorkItemStub({
        id: PENDING_ID,
        role: 'lawbringer',
        status: 'pending',
        dependsOn: [FAILED_ID],
      });
      const quest = QuestStub({
        id: QUEST_ID,
        status: 'in_progress',
        workItems: [...priorReplans, failedItem, pendingItem],
      });
      proxy.setupExhausted({ quest });

      const result = await questSplicePathseekerReplanBroker({
        questId: QUEST_ID,
        failedWorkItemId: FAILED_ID,
      });

      // Loop spent → delegates to questBlockOnFailureBroker and splices NO further replan. The actual
      // blocked + skipped persist is covered by quest-block-on-failure-broker's own test and the
      // integration test.
      expect(result).toStrictEqual({ replanned: false, blocked: true });
    });
  });

  describe('idempotency & edges', () => {
    it('EDGE: {a pathseeker replan already inserted by this item} => no-op, returns replanned true', async () => {
      const proxy = questSplicePathseekerReplanBrokerProxy();
      const failedItem = WorkItemStub({ id: FAILED_ID, role: 'codeweaver', status: 'failed' });
      const priorReplan = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'd3d4e5f6-a7b8-4c9d-8e1f-3a4b5c6d7e8f' }),
        role: 'pathseeker',
        status: 'pending',
        insertedBy: FAILED_ID,
      });
      const quest = QuestStub({
        id: QUEST_ID,
        status: 'in_progress',
        workItems: [failedItem, priorReplan],
      });
      proxy.setupReplan({ quest });

      const result = await questSplicePathseekerReplanBroker({
        questId: QUEST_ID,
        failedWorkItemId: FAILED_ID,
      });

      expect(result).toStrictEqual({ replanned: true, blocked: false });
    });

    it('EDGE: {failed work item not on quest} => returns replanned false', async () => {
      const proxy = questSplicePathseekerReplanBrokerProxy();
      const quest = QuestStub({ id: QUEST_ID, status: 'in_progress', workItems: [] });
      proxy.setupReplan({ quest });

      const result = await questSplicePathseekerReplanBroker({
        questId: QUEST_ID,
        failedWorkItemId: FAILED_ID,
      });

      expect(result).toStrictEqual({ replanned: false, blocked: false });
    });

    it('EDGE: {quest cannot be loaded} => returns replanned false, blocked false', async () => {
      const proxy = questSplicePathseekerReplanBrokerProxy();
      proxy.setupQuestNotFound();

      const result = await questSplicePathseekerReplanBroker({
        questId: QUEST_ID,
        failedWorkItemId: FAILED_ID,
      });

      expect(result).toStrictEqual({ replanned: false, blocked: false });
    });
  });
});
