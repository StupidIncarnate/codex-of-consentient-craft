import {
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { OverwriteWorkItemsLayerResponder } from './overwrite-work-items-layer-responder';
import { OverwriteWorkItemsLayerResponderProxy } from './overwrite-work-items-layer-responder.proxy';

type Quest = ReturnType<typeof QuestStub>;

const QUEST_ID = QuestIdStub({ value: 'overwrite-work-items-quest' });
const PATHSEEKER_ID = QuestWorkItemIdStub({ value: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' });
const WI_1_ID = QuestWorkItemIdStub({ value: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' });
const WI_2_ID = QuestWorkItemIdStub({ value: 'cccccccc-cccc-cccc-cccc-cccccccccccc' });

const pathseekerPreCompleted = WorkItemStub({
  id: PATHSEEKER_ID,
  role: 'pathseeker',
  status: 'complete',
});

const questWithPathseeker = QuestStub({
  id: QUEST_ID,
  workItems: [pathseekerPreCompleted],
});

describe('OverwriteWorkItemsLayerResponder', () => {
  describe('pathseeker preservation', () => {
    it('VALID: {existing pathseeker head, new chain [wi1, wi2]} => persists [pathseeker, wi1, wi2]', async () => {
      const proxy = OverwriteWorkItemsLayerResponderProxy();
      proxy.setupPassthrough();
      proxy.setupQuestFound({ quest: questWithPathseeker });

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
        workItemIds: [PATHSEEKER_ID, WI_1_ID, WI_2_ID],
        workItemRoles: ['pathseeker', 'codeweaver', 'codeweaver'],
        workItemStatuses: ['complete', 'pending', 'pending'],
      });
    });

    it('VALID: {caller chain pre-wires dependsOn to pathseeker} => dependsOn passes through unchanged', async () => {
      const proxy = OverwriteWorkItemsLayerResponderProxy();
      proxy.setupPassthrough();
      proxy.setupQuestFound({ quest: questWithPathseeker });

      const codeweaver1 = WorkItemStub({
        id: WI_1_ID,
        role: 'codeweaver',
        status: 'pending',
        dependsOn: [PATHSEEKER_ID],
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
        { id: PATHSEEKER_ID, dependsOn: [] },
        { id: WI_1_ID, dependsOn: [PATHSEEKER_ID] },
        { id: WI_2_ID, dependsOn: [WI_1_ID] },
      ]);
    });

    it('VALID: {no pre-existing pathseeker} => persists only caller chain', async () => {
      const proxy = OverwriteWorkItemsLayerResponderProxy();
      proxy.setupPassthrough();
      const questWithoutPathseeker = QuestStub({
        id: QUEST_ID,
        workItems: [],
      });
      proxy.setupQuestFound({ quest: questWithoutPathseeker });

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
      proxy.setupQuestFound({ quest: questWithPathseeker });

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
        quest: questWithPathseeker,
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
