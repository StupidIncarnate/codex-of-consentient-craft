import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts/quest-work-item-id/quest-work-item-id.stub';
import { OperationItemIdStub } from '@dungeonmaster/shared/contracts/operation-item-id/operation-item-id.stub';
import { FlowNodeStub } from '@dungeonmaster/shared/contracts/flow-node/flow-node.stub';
import { FlowObservableStub } from '@dungeonmaster/shared/contracts/flow-observable/flow-observable.stub';
import { FlowStub } from '@dungeonmaster/shared/contracts/flow/flow.stub';
import { OperationItemStub } from '@dungeonmaster/shared/contracts/operation-item/operation-item.stub';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { WorkItemStub } from '@dungeonmaster/shared/contracts/work-item/work-item.stub';

import { QuestGetQuestWorkResponder } from './quest-get-quest-work-responder';
import { QuestGetQuestWorkResponderProxy } from './quest-get-quest-work-responder.proxy';

const QUEST_ID = QuestIdStub({ value: 'add-auth' });
const WORK_ITEM_ID = QuestWorkItemIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
const OPERATION_ITEM_ID = OperationItemIdStub({ value: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479' });

const QUEST = QuestStub({
  id: QUEST_ID,
  worktreePath: '/home/testuser/worktrees/add-auth',
  flows: [
    FlowStub({
      id: 'send-flow',
      nodes: [
        FlowNodeStub({
          id: 'compose',
          packages: ['web'],
          observables: [FlowObservableStub({ id: 'unit-a', description: 'unit a holds' })],
        }),
      ],
      edges: [],
    }),
  ],
  operations: [
    OperationItemStub({
      id: OPERATION_ITEM_ID,
      role: 'codeweaver',
      flowIds: ['send-flow'],
      packageNames: [],
    }),
  ],
  workItems: [
    WorkItemStub({
      id: WORK_ITEM_ID,
      role: 'codeweaver',
      step: 'work',
      relatedDataItems: [`operations/${OPERATION_ITEM_ID}`],
      assignedUnitIds: ['send-flow:observable:unit-a'],
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
