import {
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  OperationItemStub,
  QuestPackageEntryStub,
  QuestStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { WorkPlanStub } from '../../../contracts/work-plan/work-plan.stub';
import { questRouteScopeBroker } from './quest-route-scope-broker';
import { questRouteScopeBrokerProxy } from './quest-route-scope-broker.proxy';

const CODEWEAVER_OP_ID = 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479';
const RIFTCARVER_OP_ID = 'b1b2c3d4-58cc-4372-a567-0e02b2c3d479';
const SECOND_CELL_OP_ID = 'c1b2c3d4-58cc-4372-a567-0e02b2c3d479';
const PLAN_WORK_ITEM_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const CARVE_WORK_ITEM_ID = 'e47ac10b-58cc-4372-a567-0e02b2c3d479';
const MINTED_WORK_ITEM_ID = '00000000-0000-4000-8000-000000000000';

const WEB_PACKAGE = QuestPackageEntryStub({
  name: 'web',
  location: './packages/web',
  changeType: 'edit',
  packageType: 'frontend-react',
});

const SEND_FLOW = FlowStub({
  id: 'send-flow',
  name: 'Send',
  flowType: 'runtime',
  nodes: [
    FlowNodeStub({
      id: 'composer',
      label: 'Composer',
      packages: ['web'],
      observables: [FlowObservableStub({ id: 'check-badge-count-text' })],
    }),
  ],
  edges: [],
});

const CODEWEAVER_SCOPE = OperationItemStub({
  id: CODEWEAVER_OP_ID,
  role: 'codeweaver',
  text: 'Codeweaver: build this slice — package: web · flow: send-flow',
  status: 'in_progress',
  locked: false,
  flowIds: ['send-flow'],
  packageNames: ['web'],
});

const RIFTCARVER_SCOPE = OperationItemStub({
  id: RIFTCARVER_OP_ID,
  role: 'riftcarver',
  text: 'Riftcarver: carve the quest branch, worktree and preflight typecheck',
  status: 'in_progress',
  locked: true,
  flowIds: [],
  packageNames: [],
});

describe('questRouteScopeBroker', () => {
  describe('the step routes on', () => {
    it('VALID: {a drained `plan` step declaring done, a plan cutting one `work` piece} => mints that piece at `work`, chained after the planner', async () => {
      const proxy = questRouteScopeBrokerProxy();
      proxy.setupPassthrough();

      const quest = QuestStub({
        packagesAffected: [WEB_PACKAGE],
        flows: [SEND_FLOW],
        operations: [CODEWEAVER_SCOPE],
        workItems: [
          WorkItemStub({
            id: PLAN_WORK_ITEM_ID,
            role: 'codeweaver',
            status: 'complete',
            step: 'plan',
            relatedDataItems: [`operations/${CODEWEAVER_OP_ID}`],
            declaredWord: 'done',
          }),
        ],
      });

      proxy.setupQuest({ quest });
      proxy.setupPlan({
        quest,
        operationItemId: CODEWEAVER_SCOPE.id,
        plan: WorkPlanStub({ operationItemId: CODEWEAVER_OP_ID }),
      });

      const result = await questRouteScopeBroker({ questId: quest.id });

      const persisted = proxy.getPersistedQuest();
      const minted = persisted.workItems.filter((item) => item.id !== PLAN_WORK_ITEM_ID);

      expect({
        result,
        mintedIds: minted.map((item) => String(item.id)),
        mintedSteps: minted.map((item) => String(item.step)),
        mintedPieces: minted.map((item) => String(item.pieceId)),
        mintedUnits: minted.map((item) => item.assignedUnitIds.map(String)),
        mintedDependsOn: minted.map((item) => item.dependsOn.map(String)),
        mintedRefs: minted.map((item) => item.relatedDataItems.map(String)),
      }).toStrictEqual({
        result: { routed: true, blocked: false },
        mintedIds: [MINTED_WORK_ITEM_ID],
        mintedSteps: ['work'],
        mintedPieces: ['pc-badge'],
        mintedUnits: [['send-flow:observable:check-badge-count-text']],
        mintedDependsOn: [[PLAN_WORK_ITEM_ID]],
        mintedRefs: [[`operations/${CODEWEAVER_OP_ID}`]],
      });
    });
  });

  describe('the wall halt', () => {
    it('ERROR: {a step declaring `wall`} => blocks the quest, naming the step and the family in the reason', async () => {
      const proxy = questRouteScopeBrokerProxy();
      proxy.setupPassthrough();

      const quest = QuestStub({
        packagesAffected: [WEB_PACKAGE],
        flows: [SEND_FLOW],
        operations: [CODEWEAVER_SCOPE],
        workItems: [
          WorkItemStub({
            id: PLAN_WORK_ITEM_ID,
            role: 'codeweaver',
            status: 'failed',
            step: 'plan',
            relatedDataItems: [`operations/${CODEWEAVER_OP_ID}`],
            declaredWord: 'wall',
          }),
        ],
      });

      proxy.setupQuest({ quest });

      const result = await questRouteScopeBroker({ questId: quest.id });

      const blockCalls = proxy.getBlockCalls();

      expect({
        result,
        blockedItems: blockCalls.map((call) => String(call.failedWorkItemId)),
        reasons: blockCalls.map((call) => String(call.reason)),
      }).toStrictEqual({
        result: { routed: false, blocked: true },
        blockedItems: [PLAN_WORK_ITEM_ID],
        reasons: [
          'step `plan` in family `codeweaver` folded to `wall` and routes it to `@blocked` for ' +
            `operation item ${CODEWEAVER_OP_ID}. No fresh session of any role passes this, so the ` +
            'quest halts here for a human.',
        ],
      });
    });
  });

  describe('the family route', () => {
    it('VALID: {a drained riftcarver scope} => completes it and mints the codeweaver family’s cells', async () => {
      const proxy = questRouteScopeBrokerProxy();
      proxy.setupPassthrough();

      const quest = QuestStub({
        packagesAffected: [WEB_PACKAGE],
        flows: [SEND_FLOW],
        operations: [RIFTCARVER_SCOPE],
        workItems: [
          WorkItemStub({
            id: CARVE_WORK_ITEM_ID,
            role: 'riftcarver',
            status: 'complete',
            spawnerType: 'command',
            step: 'carve',
            relatedDataItems: [`operations/${RIFTCARVER_OP_ID}`],
            declaredWord: 'done',
          }),
        ],
      });

      proxy.setupQuest({ quest });

      const result = await questRouteScopeBroker({ questId: quest.id });

      const persisted = proxy.getPersistedQuest();

      expect({
        result,
        operationRoles: persisted.operations.map((operation) => operation.role),
        operationStatuses: persisted.operations.map((operation) => operation.status),
        operationTexts: persisted.operations.map((operation) => String(operation.text)),
      }).toStrictEqual({
        result: { routed: true, blocked: false },
        operationRoles: ['riftcarver', 'codeweaver'],
        operationStatuses: ['complete', 'pending'],
        operationTexts: [
          'Riftcarver: carve the quest branch, worktree and preflight typecheck',
          'Codeweaver: build this slice — package: web · flow: send-flow',
        ],
      });
    });

    it('VALID: {one of TWO codeweaver cells completing} => the family edge does NOT fire, so no flowrider scope is minted', async () => {
      const proxy = questRouteScopeBrokerProxy();
      proxy.setupPassthrough();

      const quest = QuestStub({
        packagesAffected: [WEB_PACKAGE],
        flows: [SEND_FLOW],
        operations: [
          CODEWEAVER_SCOPE,
          OperationItemStub({
            id: SECOND_CELL_OP_ID,
            role: 'codeweaver',
            text: 'Codeweaver: build this slice — package: server · flow: send-flow',
            status: 'pending',
            locked: false,
            flowIds: ['send-flow'],
            packageNames: ['server'],
          }),
        ],
        workItems: [
          WorkItemStub({
            id: PLAN_WORK_ITEM_ID,
            role: 'codeweaver',
            status: 'complete',
            // The family's LAST step — its `done` routes to `@done`, which is what completes a
            // scope. `commit` routes to `ward`, so it would mint rather than complete.
            step: 'ward',
            relatedDataItems: [`operations/${CODEWEAVER_OP_ID}`],
            declaredWord: 'done',
          }),
        ],
      });

      proxy.setupQuest({ quest });

      const result = await questRouteScopeBroker({ questId: quest.id });

      const persisted = proxy.getPersistedQuest();

      expect({
        result,
        operationRoles: persisted.operations.map((operation) => operation.role),
        operationStatuses: persisted.operations.map((operation) => operation.status),
      }).toStrictEqual({
        result: { routed: true, blocked: false },
        operationRoles: ['codeweaver', 'codeweaver'],
        operationStatuses: ['complete', 'pending'],
      });
    });
  });

  describe('nothing to route', () => {
    it('EMPTY: {a scope whose work item is still in_progress} => writes nothing', async () => {
      const proxy = questRouteScopeBrokerProxy();
      proxy.setupPassthrough();

      const quest = QuestStub({
        packagesAffected: [WEB_PACKAGE],
        flows: [SEND_FLOW],
        operations: [CODEWEAVER_SCOPE],
        workItems: [
          WorkItemStub({
            id: PLAN_WORK_ITEM_ID,
            role: 'codeweaver',
            status: 'in_progress',
            step: 'plan',
            relatedDataItems: [`operations/${CODEWEAVER_OP_ID}`],
          }),
        ],
      });

      proxy.setupQuest({ quest });

      await expect(questRouteScopeBroker({ questId: quest.id })).resolves.toStrictEqual({
        routed: false,
        blocked: false,
      });
    });
  });
});
