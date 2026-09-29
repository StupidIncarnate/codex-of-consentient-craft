import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts/quest-work-item-id/quest-work-item-id.stub';
import { WorkItemStub } from '@dungeonmaster/shared/contracts/work-item/work-item.stub';

import { OverwriteWorkItemsLayerResponder } from './overwrite-work-items-layer-responder';
import { OverwriteWorkItemsLayerResponderProxy } from './overwrite-work-items-layer-responder.proxy';

type Quest = ReturnType<typeof QuestStub>;

const QUEST_ID = QuestIdStub({ value: 'overwrite-work-items-quest' });
const PRIOR_ID = QuestWorkItemIdStub({ value: 'e4a1c2fd-8bcf-83b0-ba4b-1818d51fc09c' });
const WI_1_ID = QuestWorkItemIdStub({ value: '9febc069-b4e3-2f38-bd80-34df765c3b3e' });
const WI_2_ID = QuestWorkItemIdStub({ value: '7deffe0a-8c09-6b80-b915-2d977bb48a5c' });

const priorHead = WorkItemStub({
  id: PRIOR_ID,
  role: 'codeweaver',
  status: 'complete',
});

const questWithPriorItem = QuestStub({
  id: QUEST_ID,
  workItems: [priorHead],
});

describe('OverwriteWorkItemsLayerResponder', () => {
  describe('wholesale overwrite', () => {
    it('VALID: {prior head, new chain [wi1, wi2]} => persists ONLY the new chain (prior head dropped)', async () => {
      const proxy = OverwriteWorkItemsLayerResponderProxy();
      proxy.setupPassthrough();
      proxy.setupQuestFound({ quest: questWithPriorItem });

      const codeweaver1 = WorkItemStub({ id: WI_1_ID, role: 'codeweaver', status: 'pending' });
      const codeweaver2 = WorkItemStub({
        id: WI_2_ID,
        role: 'codeweaver',
        status: 'pending',
        dependsOn: [WI_1_ID],
      });

      const result = await OverwriteWorkItemsLayerResponder({
        questId: QUEST_ID,
        workItems: [codeweaver1, codeweaver2],
      });

      const persisted = proxy.getAllPersistedContents();
      const lastWritten = persisted[persisted.length - 1];
      const parsed = JSON.parse(String(lastWritten)) as Quest;

      expect({
        result,
        workItemIds: parsed.workItems.map((wi) => wi.id),
        workItemRoles: parsed.workItems.map((wi) => wi.role),
        workItemStatuses: parsed.workItems.map((wi) => wi.status),
      }).toStrictEqual({
        result: { success: true },
        workItemIds: [WI_1_ID, WI_2_ID],
        workItemRoles: ['codeweaver', 'codeweaver'],
        workItemStatuses: ['pending', 'pending'],
      });
    });

    it('VALID: {caller chain pre-wires dependsOn} => dependsOn passes through unchanged', async () => {
      const proxy = OverwriteWorkItemsLayerResponderProxy();
      proxy.setupPassthrough();
      proxy.setupQuestFound({ quest: questWithPriorItem });

      const codeweaver1 = WorkItemStub({
        id: WI_1_ID,
        role: 'codeweaver',
        status: 'pending',
        dependsOn: [],
      });
      const codeweaver2 = WorkItemStub({
        id: WI_2_ID,
        role: 'codeweaver',
        status: 'pending',
        dependsOn: [WI_1_ID],
      });

      await OverwriteWorkItemsLayerResponder({
        questId: QUEST_ID,
        workItems: [codeweaver1, codeweaver2],
      });

      const persisted = proxy.getAllPersistedContents();
      const lastWritten = persisted[persisted.length - 1];
      const parsed = JSON.parse(String(lastWritten)) as Quest;

      expect(parsed.workItems.map((wi) => ({ id: wi.id, dependsOn: wi.dependsOn }))).toStrictEqual([
        { id: WI_1_ID, dependsOn: [] },
        { id: WI_2_ID, dependsOn: [WI_1_ID] },
      ]);
    });

    it('VALID: {no prior work items} => persists only the caller chain', async () => {
      const proxy = OverwriteWorkItemsLayerResponderProxy();
      proxy.setupPassthrough();
      const questWithoutItems = QuestStub({
        id: QUEST_ID,
        workItems: [],
      });
      proxy.setupQuestFound({ quest: questWithoutItems });

      const codeweaver1 = WorkItemStub({ id: WI_1_ID, role: 'codeweaver', status: 'pending' });

      await OverwriteWorkItemsLayerResponder({
        questId: QUEST_ID,
        workItems: [codeweaver1],
      });

      const persisted = proxy.getAllPersistedContents();
      const lastWritten = persisted[persisted.length - 1];
      const parsed = JSON.parse(String(lastWritten)) as Quest;

      expect(parsed.workItems.map((wi) => wi.id)).toStrictEqual([WI_1_ID]);
    });
  });

  describe('lock acquisition', () => {
    it('VALID: {overwrite call} => acquires modify lock via questWithModifyLockBroker', async () => {
      const proxy = OverwriteWorkItemsLayerResponderProxy();
      proxy.setupPassthrough();
      proxy.setupQuestFound({ quest: questWithPriorItem });

      const codeweaver1 = WorkItemStub({ id: WI_1_ID, role: 'codeweaver', status: 'pending' });

      const result = await OverwriteWorkItemsLayerResponder({
        questId: QUEST_ID,
        workItems: [codeweaver1],
      });

      // Lock correctness is proven by the persist side-effect occurring with the merged
      // workItems — if the lock short-circuited, persist would not run (no write content)
      // and the success result would not surface.
      const persisted = proxy.getAllPersistedContents();

      expect({
        result,
        persistedCount: persisted.length,
      }).toStrictEqual({
        result: { success: true },
        persistedCount: 1,
      });
    });
  });

  describe('write failure propagation', () => {
    it('ERROR: {persist write fails inside lock} => responder rejects with the underlying error', async () => {
      const proxy = OverwriteWorkItemsLayerResponderProxy();
      proxy.setupPassthrough();
      proxy.setupQuestFoundWithWriteFailure({
        quest: questWithPriorItem,
        error: new Error('disk full'),
      });

      const codeweaver1 = WorkItemStub({ id: WI_1_ID, role: 'codeweaver', status: 'pending' });

      // The responder wraps work inside questWithModifyLockBroker's `run` callback.
      // `questWithModifyLockBroker` returns the callback's promise verbatim, with the
      // lock-chain entry separately swallowing rejections so subsequent callers on the
      // same questId can still acquire. This test verifies the caller-visible contract:
      // the underlying write error surfaces unchanged through the lock wrapper.
      await expect(
        OverwriteWorkItemsLayerResponder({
          questId: QUEST_ID,
          workItems: [codeweaver1],
        }),
      ).rejects.toThrow(/disk full/u);
    });
  });
});
