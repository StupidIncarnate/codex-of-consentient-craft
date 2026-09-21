import {
  OperationItemIdStub,
  OperationItemStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { WorkPlanFieldsStub } from '../../../contracts/work-plan-fields/work-plan-fields.stub';
import { QuestWorkResponderProxy } from './quest-work-responder.proxy';

const QUEST_ID = QuestIdStub({ value: 'add-auth' });
const WORK_ITEM_ID = QuestWorkItemIdStub({ value: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' });
const OPERATION_ITEM_ID = OperationItemIdStub({ value: '00000000-0000-4000-8000-000000000001' });

describe('QuestWorkResponder', () => {
  describe('plan payload', () => {
    it('VALID: {kind: plan} => routes to the plan-write broker and returns operationItemId', async () => {
      const proxy = QuestWorkResponderProxy();
      const operationItem = OperationItemStub({ id: OPERATION_ITEM_ID, role: 'codeweaver' });
      const workItem = WorkItemStub({
        id: WORK_ITEM_ID,
        role: 'codeweaver',
        relatedDataItems: [`operations/${String(OPERATION_ITEM_ID)}`],
      });
      const quest = QuestStub({
        id: QUEST_ID,
        operations: [operationItem],
        workItems: [workItem],
      });
      proxy.setupPlanQuestFound({ quest, writesOperationItemId: OPERATION_ITEM_ID });

      // Zero pieces trivially passes every one of story 08's nineteen checks — the checks
      // themselves are exercised exhaustively at the broker level; this test proves routing.
      const plan = { ...WorkPlanFieldsStub({ operationItemId: OPERATION_ITEM_ID, batches: [] }) };
      Reflect.deleteProperty(plan, 'writtenBy');
      Reflect.deleteProperty(plan, 'writtenAt');

      const result = await proxy.callResponder({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
        payload: { kind: 'plan', plan },
      });

      expect(result).toStrictEqual({ kind: 'plan', operationItemId: OPERATION_ITEM_ID });
    });
  });

  describe('observations payload', () => {
    it('VALID: {kind: observations} => routes to the record broker and persists', async () => {
      const proxy = QuestWorkResponderProxy();
      const workItem = WorkItemStub({ id: WORK_ITEM_ID, observations: [] });
      const quest = QuestStub({ id: QUEST_ID, workItems: [workItem] });
      proxy.setupRecordQuestFound({ quest });

      const result = await proxy.callResponder({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
        payload: {
          kind: 'observations',
          observations: [
            {
              unitId: 'send-flow:observable:scan-finds-every-path',
              mark: 'met',
              evidence: 'send.test.ts:12',
            },
          ],
        },
      });

      expect(result).toStrictEqual({ kind: 'observations', count: 1 });

      const [persisted] = proxy.getRecordPersistedQuests();
      const { workItems } = persisted as ReturnType<typeof QuestStub>;

      expect(workItems[0]?.observations.length).toBe(1);
    });
  });

  describe('outcome payload — a refusal rides all the way back to the caller', () => {
    it('ERROR: {units held contradict the declared word} => rejects, no success shape returned', async () => {
      const proxy = QuestWorkResponderProxy();
      const workItem = WorkItemStub({
        id: WORK_ITEM_ID,
        assignedUnitIds: ['send-flow:observable:scan-finds-every-path'],
        observations: [],
      });
      const quest = QuestStub({ id: QUEST_ID, workItems: [workItem] });
      proxy.setupRecordQuestFound({ quest });

      await expect(
        proxy.callResponder({
          questId: QUEST_ID,
          workItemId: WORK_ITEM_ID,
          payload: { kind: 'outcome', word: 'done', reason: 'looks done' },
        }),
      ).rejects.toThrow(/quest-work: work item .* is assigned 1 unit\(s\)/u);
    });
  });

  describe('the discriminated union', () => {
    it("INVALID: {payload.kind: 'signal'} => refused before any broker is called", async () => {
      const proxy = QuestWorkResponderProxy();

      await expect(
        proxy.callResponder({
          questId: QUEST_ID,
          workItemId: WORK_ITEM_ID,
          payload: { kind: 'signal', reason: 'not a real kind' },
        }),
      ).rejects.toThrow(/invalid/iu);
    });
  });
});
