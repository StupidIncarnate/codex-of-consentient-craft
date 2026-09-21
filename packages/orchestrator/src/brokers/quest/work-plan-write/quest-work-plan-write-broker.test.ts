import {
  OperationItemIdStub,
  OperationItemStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { questWorkPlanWriteBroker } from './quest-work-plan-write-broker';
import { questWorkPlanWriteBrokerProxy } from './quest-work-plan-write-broker.proxy';

const QUEST_ID = QuestIdStub({ value: 'add-auth' });
const WORK_ITEM_ID = QuestWorkItemIdStub({ value: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' });
const OPERATION_ITEM_ID = OperationItemIdStub({ value: '00000000-0000-4000-8000-000000000001' });

const OPERATION_ITEM = OperationItemStub({
  id: OPERATION_ITEM_ID,
  role: 'codeweaver',
  text: 'Codeweaver: build this slice',
  status: 'in_progress',
});

const WORK_ITEM = WorkItemStub({
  id: WORK_ITEM_ID,
  role: 'codeweaver',
  status: 'in_progress',
  relatedDataItems: [`operations/${String(OPERATION_ITEM_ID)}`],
});

describe('questWorkPlanWriteBroker', () => {
  describe('a zero-piece plan (trivially passes all nineteen checks)', () => {
    it('VALID: {plan with no batches, flowId null} => writes the plan and returns its operationItemId', async () => {
      const proxy = questWorkPlanWriteBrokerProxy();
      const quest = QuestStub({
        id: QUEST_ID,
        operations: [OPERATION_ITEM],
        workItems: [WORK_ITEM],
      });
      const { questFolderPath } = proxy.setupQuestFound({
        quest,
        writesOperationItemId: OPERATION_ITEM_ID,
      });

      const result = await questWorkPlanWriteBroker({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
        plan: {
          operationItemId: OPERATION_ITEM_ID,
          family: 'codeweaver',
          flowId: null,
          packageNames: [],
          batches: [],
          plannerMarks: [],
        } as never,
      });

      expect(result).toStrictEqual({ operationItemId: OPERATION_ITEM_ID });

      const written = JSON.parse(
        String(
          proxy.getWrittenPlan({
            questFolderPath,
            operationItemId: OPERATION_ITEM_ID,
          }),
        ),
      ) as unknown;

      expect(written).toStrictEqual({
        operationItemId: OPERATION_ITEM_ID,
        family: 'codeweaver',
        flowId: null,
        packageNames: [],
        writtenBy: WORK_ITEM_ID,
        writtenAt: '2026-01-15T10:00:00.000Z',
        batches: [],
        plannerMarks: [],
      });
    });
  });

  describe('a plan that fails validation', () => {
    it('ERROR: {a piece assigned a unit not on the quest} => refuses whole, naming the piece, and writes nothing', async () => {
      const proxy = questWorkPlanWriteBrokerProxy();
      const quest = QuestStub({
        id: QUEST_ID,
        operations: [OPERATION_ITEM],
        workItems: [WORK_ITEM],
      });
      const { questFolderPath } = proxy.setupQuestFound({ quest });

      await expect(
        questWorkPlanWriteBroker({
          questId: QUEST_ID,
          workItemId: WORK_ITEM_ID,
          plan: {
            operationItemId: OPERATION_ITEM_ID,
            family: 'codeweaver',
            flowId: null,
            packageNames: [],
            batches: [
              {
                mode: 'parallel',
                pieces: [
                  {
                    id: 'pc-1',
                    step: 'work',
                    assignedUnitIds: ['no-such-flow:observable:bogus'],
                    contextUnitIds: [],
                    context: 'this unit does not exist on the quest',
                    notes: [],
                    payload: {
                      files: [],
                      facts: [],
                      fences: [],
                      traps: [],
                      doNotTouch: [],
                      units: [
                        {
                          unitId: 'no-such-flow:observable:bogus',
                          kind: 'observable',
                          observableType: 'ui-state',
                          text: 'a unit that does not exist on this quest',
                          assert: 'nothing — this unit is fictitious',
                          failsIf: 'nothing — this unit is fictitious',
                        },
                      ],
                    },
                  },
                ],
              },
            ],
            plannerMarks: [],
          } as never,
        }),
      ).rejects.toThrow(/quest-work: plan refused.*Nothing was written.*pc-1/su);

      const written = proxy.getWrittenPlan({ questFolderPath, operationItemId: OPERATION_ITEM_ID });

      expect(written).toBe(undefined);
    });
  });

  describe('the asking work item is not on the quest', () => {
    it('ERROR: {an unknown workItemId} => throws naming it, writes nothing', async () => {
      const proxy = questWorkPlanWriteBrokerProxy();
      const quest = QuestStub({
        id: QUEST_ID,
        operations: [OPERATION_ITEM],
        workItems: [WORK_ITEM],
      });
      proxy.setupQuestFound({ quest });

      await expect(
        questWorkPlanWriteBroker({
          questId: QUEST_ID,
          workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' }),
          plan: {
            operationItemId: OPERATION_ITEM_ID,
            family: 'codeweaver',
            flowId: null,
            packageNames: [],
            batches: [],
            plannerMarks: [],
          } as never,
        }),
      ).rejects.toThrow(
        /^quest-work: work item bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb is not on quest add-auth — nothing was written$/u,
      );
    });
  });
});
