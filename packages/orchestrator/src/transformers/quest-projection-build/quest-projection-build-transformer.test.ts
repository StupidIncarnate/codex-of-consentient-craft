import {
  OperationItemIdStub,
  OperationItemStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';
import { questFlowStatics } from '@dungeonmaster/shared/statics';

import { agentFlowStatics } from '../../statics/agent-flow/agent-flow-statics';
import { nextActionTransformer } from '../next-action/next-action-transformer';
import { questProjectionBuildTransformer } from './quest-projection-build-transformer';

const CODEWEAVER_OP_ID = OperationItemIdStub({ value: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479' });
const CODEWEAVER_SCOPE_REF = `operations/${CODEWEAVER_OP_ID}`;

const WI_PLAN = QuestWorkItemIdStub({ value: '11111111-1111-4111-8111-111111111111' });
const WI_WORK_1 = QuestWorkItemIdStub({ value: '22222222-2222-4222-8222-222222222222' });
const WI_REVIEW_1 = QuestWorkItemIdStub({ value: '33333333-3333-4333-8333-333333333333' });
const WI_WORK_2 = QuestWorkItemIdStub({ value: '44444444-4444-4444-8444-444444444444' });
const WI_REVIEW_2 = QuestWorkItemIdStub({ value: '55555555-5555-4555-8555-555555555555' });

describe('questProjectionBuildTransformer', () => {
  describe('a real quest mid-codeweaver, one review->work back-edge taken', () => {
    it('VALID: {plan, work, review(unmet), work(mintedBy review), review(in_progress)} => actual rows keep array order, the back-edge and its mintedBy, then plans commit and ward', () => {
      const quest = QuestStub({
        operations: [
          OperationItemStub({
            id: CODEWEAVER_OP_ID,
            role: 'codeweaver',
            text: 'core: config load+validate adapter',
            status: 'in_progress',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: WI_PLAN,
            role: 'codeweaver',
            status: 'complete',
            step: 'plan',
            relatedDataItems: [CODEWEAVER_SCOPE_REF],
          }),
          WorkItemStub({
            id: WI_WORK_1,
            role: 'codeweaver',
            status: 'complete',
            step: 'work',
            relatedDataItems: [CODEWEAVER_SCOPE_REF],
          }),
          WorkItemStub({
            id: WI_REVIEW_1,
            role: 'codeweaver',
            status: 'complete',
            step: 'review',
            relatedDataItems: [CODEWEAVER_SCOPE_REF],
          }),
          WorkItemStub({
            id: WI_WORK_2,
            role: 'codeweaver',
            status: 'complete',
            step: 'work',
            mintedBy: WI_REVIEW_1,
            relatedDataItems: [CODEWEAVER_SCOPE_REF],
          }),
          WorkItemStub({
            id: WI_REVIEW_2,
            role: 'codeweaver',
            status: 'in_progress',
            step: 'review',
            relatedDataItems: [CODEWEAVER_SCOPE_REF],
          }),
        ],
      });

      const projection = questProjectionBuildTransformer({ quest });

      expect(projection).toStrictEqual({
        questId: 'add-auth',
        scopes: [
          {
            operationId: CODEWEAVER_OP_ID,
            role: 'codeweaver',
            text: 'core: config load+validate adapter',
            status: 'in_progress',
            steps: [
              { step: 'plan', kind: 'actual', workItemId: WI_PLAN, status: 'complete' },
              { step: 'work', kind: 'actual', workItemId: WI_WORK_1, status: 'complete' },
              { step: 'review', kind: 'actual', workItemId: WI_REVIEW_1, status: 'complete' },
              {
                step: 'work',
                kind: 'actual',
                workItemId: WI_WORK_2,
                status: 'complete',
                mintedBy: WI_REVIEW_1,
              },
              { step: 'review', kind: 'actual', workItemId: WI_REVIEW_2, status: 'in_progress' },
              { step: 'commit', kind: 'planned' },
              { step: 'ward', kind: 'planned' },
            ],
          },
        ],
        totalPlannedSteps: 7,
        completedSteps: 4,
      });
    });
  });

  describe('a freshly minted scope, no work items yet', () => {
    it('VALID: {flowrider scope, zero work items} => plans the whole chain from the family entry', () => {
      const opId = OperationItemIdStub({ value: 'b2c3d4e5-58cc-4372-a567-0e02b2c3d479' });
      const quest = QuestStub({
        operations: [
          OperationItemStub({
            id: opId,
            role: 'flowrider',
            text: 'Flowrider: author the test suites that prove this flow',
            status: 'pending',
          }),
        ],
        workItems: [],
      });

      expect(questProjectionBuildTransformer({ quest })).toStrictEqual({
        questId: 'add-auth',
        scopes: [
          {
            operationId: opId,
            role: 'flowrider',
            text: 'Flowrider: author the test suites that prove this flow',
            status: 'pending',
            steps: [
              { step: 'plan', kind: 'planned' },
              { step: 'work', kind: 'planned' },
              { step: 'review', kind: 'planned' },
              { step: 'commit', kind: 'planned' },
              { step: 'ward', kind: 'planned' },
            ],
          },
        ],
        totalPlannedSteps: 5,
        completedSteps: 0,
      });
    });
  });

  describe('two scopes on one quest', () => {
    it('VALID: {a codeweaver scope one step in, a fresh flowrider scope} => the two counts SUM across scopes rather than reporting the last one', () => {
      const codeweaverOpId = OperationItemIdStub({ value: 'f6a7b8c9-58cc-4372-a567-0e02b2c3d479' });
      const flowriderOpId = OperationItemIdStub({ value: 'a7b8c9d0-58cc-4372-a567-0e02b2c3d479' });
      const planWorkItemId = QuestWorkItemIdStub({ value: '88888888-8888-4888-8888-888888888888' });
      const quest = QuestStub({
        operations: [
          OperationItemStub({
            id: codeweaverOpId,
            role: 'codeweaver',
            text: 'core: config load+validate adapter',
            status: 'in_progress',
          }),
          OperationItemStub({
            id: flowriderOpId,
            role: 'flowrider',
            text: 'Flowrider: author the test suites that prove this flow',
            status: 'pending',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: planWorkItemId,
            role: 'codeweaver',
            status: 'complete',
            step: 'plan',
            relatedDataItems: [`operations/${codeweaverOpId}`],
          }),
        ],
      });

      const projection = questProjectionBuildTransformer({ quest });

      expect({
        scopeCount: projection.scopes.length,
        totalPlannedSteps: projection.totalPlannedSteps,
        completedSteps: projection.completedSteps,
      }).toStrictEqual({
        scopeCount: 2,
        // codeweaver: 1 actual (plan) + 4 planned (work, review, commit, ward) = 5
        // flowrider: 0 actual + 5 planned (plan, work, review, commit, ward) = 5
        totalPlannedSteps: 10,
        // only the codeweaver scope's 'plan' row is complete
        completedSteps: 1,
      });
    });
  });

  describe("siegemaster's ward step, CLOSE_OUT overridden", () => {
    it("VALID: {siegemaster scope drained at ward} => plans sweepOut, not @done's usual close-out", () => {
      const opId = OperationItemIdStub({ value: 'c3d4e5f6-58cc-4372-a567-0e02b2c3d479' });
      const wardWorkItemId = QuestWorkItemIdStub({ value: '66666666-6666-4666-8666-666666666666' });
      const quest = QuestStub({
        operations: [
          OperationItemStub({
            id: opId,
            role: 'siegemaster',
            text: 'Siegemaster: manual-QA this flow and review its test suite',
            status: 'in_progress',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: wardWorkItemId,
            role: 'siegemaster',
            status: 'complete',
            step: 'ward',
            relatedDataItems: [`operations/${opId}`],
          }),
        ],
      });

      expect(questProjectionBuildTransformer({ quest })).toStrictEqual({
        questId: 'add-auth',
        scopes: [
          {
            operationId: opId,
            role: 'siegemaster',
            text: 'Siegemaster: manual-QA this flow and review its test suite',
            status: 'in_progress',
            steps: [
              { step: 'ward', kind: 'actual', workItemId: wardWorkItemId, status: 'complete' },
              { step: 'sweepOut', kind: 'planned' },
            ],
          },
        ],
        totalPlannedSteps: 2,
        completedSteps: 1,
      });
    });
  });

  describe('no operations minted yet', () => {
    it('VALID: {quest with zero operations} => empty scopes and zero counts', () => {
      const quest = QuestStub({ operations: [], workItems: [] });

      expect(questProjectionBuildTransformer({ quest })).toStrictEqual({
        questId: 'add-auth',
        scopes: [],
        totalPlannedSteps: 0,
        completedSteps: 0,
      });
    });
  });

  describe('ERROR: an operation item role no family carries', () => {
    it("ERROR: {role: 'spiritmender'} => throws, no family in questFlowStatics carries that role", () => {
      const opId = OperationItemIdStub({ value: 'd4e5f6a7-58cc-4372-a567-0e02b2c3d479' });
      const quest = QuestStub({
        operations: [OperationItemStub({ id: opId, role: 'spiritmender', status: 'pending' })],
        workItems: [],
      });

      expect(() => questProjectionBuildTransformer({ quest })).toThrow(
        /no family in questFlowStatics\.feature\.families carries role 'spiritmender'/u,
      );
    });
  });

  describe('agreement with the router', () => {
    it('VALID: {commit drained, assignedUnitIds: []} => the first planned step is exactly what nextActionTransformer mints for the done fold', () => {
      const opId = OperationItemIdStub({ value: 'e5f6a7b8-58cc-4372-a567-0e02b2c3d479' });
      const commitWorkItemId = QuestWorkItemIdStub({
        value: '77777777-7777-4777-8777-777777777777',
      });
      const quest = QuestStub({
        operations: [
          OperationItemStub({
            id: opId,
            role: 'codeweaver',
            text: 'core: config load+validate adapter',
            status: 'in_progress',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: commitWorkItemId,
            role: 'codeweaver',
            status: 'complete',
            step: 'commit',
            assignedUnitIds: [],
            relatedDataItems: [`operations/${opId}`],
          }),
        ],
      });

      const nextAction = nextActionTransformer({
        quest,
        plan: null,
        operationItemId: opId,
        agentFlowStatics,
        questFlowStatics,
      });

      const projection = questProjectionBuildTransformer({ quest });
      const firstPlanned = projection.scopes[0]?.steps[1];

      expect(nextAction).toStrictEqual({
        kind: 'route',
        operationItemId: opId,
        from: 'commit',
        outcome: 'done',
        step: 'ward',
        batch: [{ step: 'ward', role: 'codeweaver', assignedUnitIds: [], needsLane: false }],
      });
      expect(firstPlanned).toStrictEqual({ step: 'ward', kind: 'planned' });
    });
  });
});
