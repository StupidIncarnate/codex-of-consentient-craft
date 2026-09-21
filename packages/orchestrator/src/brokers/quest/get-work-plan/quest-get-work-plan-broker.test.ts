import {
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  OperationItemStub,
  QuestIdStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { WorkPlanBatchStub } from '../../../contracts/work-plan-batch/work-plan-batch.stub';
import { WorkPlanPayloadCodeweaverStub } from '../../../contracts/work-plan-payload-codeweaver/work-plan-payload-codeweaver.stub';
import { WorkPlanPieceStub } from '../../../contracts/work-plan-piece/work-plan-piece.stub';
import { WorkPlanStub } from '../../../contracts/work-plan/work-plan.stub';
import { questGetWorkPlanBroker } from './quest-get-work-plan-broker';
import { questGetWorkPlanBrokerProxy } from './quest-get-work-plan-broker.proxy';

const QUEST_ID = QuestIdStub({ value: 'add-auth' });
const OPERATION_ITEM_ID = 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479';
const UNIT_A = 'send-flow:observable:unit-a';
const UNIT_B = 'send-flow:observable:unit-b';

const FLOW = FlowStub({
  id: 'send-flow' as never,
  nodes: [
    FlowNodeStub({
      id: 'compose' as never,
      packages: ['web'] as never,
      observables: [
        FlowObservableStub({ id: 'unit-a' as never, description: 'unit a holds' as never }),
        FlowObservableStub({ id: 'unit-b' as never, description: 'unit b holds' as never }),
      ],
    }),
  ],
  edges: [],
});

const QUEST = QuestStub({
  id: QUEST_ID,
  flows: [FLOW],
  operations: [
    OperationItemStub({
      id: OPERATION_ITEM_ID as never,
      role: 'codeweaver',
      flowIds: ['send-flow'] as never,
      packageNames: [],
    }),
  ],
});

// One piece claiming unit-a and nothing claiming unit-b — the hole a planner most needs to see.
const PLAN = WorkPlanStub({
  operationItemId: OPERATION_ITEM_ID as never,
  batches: [
    WorkPlanBatchStub({
      pieces: [
        WorkPlanPieceStub({
          id: 'pc-badge' as never,
          assignedUnitIds: [UNIT_A] as never,
          contextUnitIds: [],
          payload: WorkPlanPayloadCodeweaverStub({
            units: [
              {
                unitId: UNIT_A,
                kind: 'observable',
                observableType: 'ui-state',
                text: 'unit a holds',
                assert: 'render the widget and read the value back',
                failsIf: 'the queued value is read instead',
              },
            ] as never,
          }),
        }),
      ],
    }),
  ],
});

describe('questGetWorkPlanBroker', () => {
  describe('coverage in the rendered text', () => {
    it('VALID: {a unit no piece claims} => the rendered TEXT carries that row, which JSON cannot show', async () => {
      const proxy = questGetWorkPlanBrokerProxy();
      proxy.setupPlanFound({
        quest: QUEST,
        operationItemId: OPERATION_ITEM_ID as never,
        plan: PLAN,
      });

      const text = await questGetWorkPlanBroker({
        questId: QUEST_ID,
        operationItemId: OPERATION_ITEM_ID as never,
      });

      const row = String(text)
        .split('\n')
        .find((line) => line.startsWith(`| \`${UNIT_B}\``));

      expect(row).toBe(`| \`${UNIT_B}\` | outstanding | — NO PIECE CLAIMS THIS UNIT — |`);
    });

    it('VALID: {the claimed unit} => its row names the claiming piece', async () => {
      const proxy = questGetWorkPlanBrokerProxy();
      proxy.setupPlanFound({
        quest: QUEST,
        operationItemId: OPERATION_ITEM_ID as never,
        plan: PLAN,
      });

      const text = await questGetWorkPlanBroker({
        questId: QUEST_ID,
        operationItemId: OPERATION_ITEM_ID as never,
      });

      const row = String(text)
        .split('\n')
        .find((line) => line.startsWith(`| \`${UNIT_A}\``));

      expect(row).toBe(`| \`${UNIT_A}\` | outstanding | \`pc-badge\` |`);
    });
  });

  describe('no plan yet', () => {
    it('EMPTY: {no plan file} => the sentence saying so, never a blank document', async () => {
      const proxy = questGetWorkPlanBrokerProxy();
      proxy.setupPlanMissing({ quest: QUEST, operationItemId: OPERATION_ITEM_ID as never });

      const text = await questGetWorkPlanBroker({
        questId: QUEST_ID,
        operationItemId: OPERATION_ITEM_ID as never,
      });

      const line = String(text)
        .split('\n')
        .find((entry) => entry.startsWith('No planner has run'));

      expect(line).toBe(
        'No planner has run against this item yet, so there is no plan to review. That is a real',
      );
    });
  });

  describe('refusals', () => {
    it('ERROR: {an operationItemId not on the quest} => throws naming it and the quest', async () => {
      const proxy = questGetWorkPlanBrokerProxy();
      proxy.setupPlanMissing({ quest: QUEST, operationItemId: OPERATION_ITEM_ID as never });

      await expect(
        questGetWorkPlanBroker({
          questId: QUEST_ID,
          operationItemId: 'c3d4e5f6-58cc-4372-a567-0e02b2c3d479' as never,
        }),
      ).rejects.toThrow(
        /get-quest-work: operation item c3d4e5f6-58cc-4372-a567-0e02b2c3d479 is not on quest add-auth/u,
      );
    });
  });
});
