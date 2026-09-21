import {
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  OperationItemStub,
  QuestStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { QuestGetQuestWorkResponder } from './quest-get-quest-work-responder';
import { QuestGetQuestWorkResponderProxy } from './quest-get-quest-work-responder.proxy';

const QUEST_ID = 'add-auth';
const WORK_ITEM_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const OPERATION_ITEM_ID = 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479';

const QUEST = QuestStub({
  id: QUEST_ID as never,
  worktreePath: '/home/testuser/worktrees/add-auth' as never,
  flows: [
    FlowStub({
      id: 'send-flow' as never,
      nodes: [
        FlowNodeStub({
          id: 'compose' as never,
          packages: ['web'] as never,
          observables: [
            FlowObservableStub({ id: 'unit-a' as never, description: 'unit a holds' as never }),
          ],
        }),
      ],
      edges: [],
    }),
  ],
  operations: [
    OperationItemStub({
      id: OPERATION_ITEM_ID as never,
      role: 'codeweaver',
      flowIds: ['send-flow'] as never,
      packageNames: [],
    }),
  ],
  workItems: [
    WorkItemStub({
      id: WORK_ITEM_ID as never,
      role: 'codeweaver',
      step: 'work' as never,
      relatedDataItems: [`operations/${OPERATION_ITEM_ID}`] as never,
      assignedUnitIds: ['send-flow:observable:unit-a'] as never,
    }),
  ],
});

describe('QuestGetQuestWorkResponder', () => {
  describe('the work-item shape', () => {
    it('VALID: {questId, workItemId} => the view is served and planText is null', async () => {
      const proxy = QuestGetQuestWorkResponderProxy();
      proxy.setupWorkItemView({ quest: QUEST, operationItemId: OPERATION_ITEM_ID as never });

      const result = await QuestGetQuestWorkResponder({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
      });

      expect({
        workItemId: result.view?.workItemId,
        planText: result.planText,
      }).toStrictEqual({ workItemId: WORK_ITEM_ID, planText: null });
    });

    it('VALID: {questId, workItemId} => the view carries this session’s assigned unit', async () => {
      const proxy = QuestGetQuestWorkResponderProxy();
      proxy.setupWorkItemView({ quest: QUEST, operationItemId: OPERATION_ITEM_ID as never });

      const result = await QuestGetQuestWorkResponder({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
      });

      expect(result.view?.assignedUnits.map((unit) => String(unit.unitId))).toStrictEqual([
        'send-flow:observable:unit-a',
      ]);
    });
  });

  describe('the operation-item shape', () => {
    it('VALID: {questId, operationItemId} => the markdown is served and view is null', async () => {
      const proxy = QuestGetQuestWorkResponderProxy();
      proxy.setupPlanRender({ quest: QUEST, operationItemId: OPERATION_ITEM_ID as never });

      const result = await QuestGetQuestWorkResponder({
        questId: QUEST_ID,
        operationItemId: OPERATION_ITEM_ID,
      });

      expect({
        heading: String(result.planText).split('\n')[0],
        view: result.view,
      }).toStrictEqual({
        heading: `# Plan for operation item ${OPERATION_ITEM_ID}`,
        view: null,
      });
    });
  });

  describe('refusals', () => {
    it('INVALID: {questId, workItemId, operationItemId} => refused, naming both shapes', async () => {
      QuestGetQuestWorkResponderProxy();

      await expect(
        QuestGetQuestWorkResponder({
          questId: QUEST_ID,
          workItemId: WORK_ITEM_ID,
          operationItemId: OPERATION_ITEM_ID,
        }),
      ).rejects.toThrow(/workItemId cannot be combined with operationItemId/u);
    });

    it('EMPTY: {questId alone} => refused, because there is no whole-quest browse form', async () => {
      QuestGetQuestWorkResponderProxy();

      await expect(QuestGetQuestWorkResponder({ questId: QUEST_ID })).rejects.toThrow(
        /There is no whole-quest browse form/u,
      );
    });
  });
});
