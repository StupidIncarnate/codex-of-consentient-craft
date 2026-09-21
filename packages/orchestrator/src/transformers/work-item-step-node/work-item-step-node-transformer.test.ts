import { OperationItemStub, QuestStub, WorkItemStub } from '@dungeonmaster/shared/contracts';

import { workItemStepNodeTransformer } from './work-item-step-node-transformer';

const CODEWEAVER_OP_ID = 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479';
const SPIRITMENDER_OP_ID = 'b1b2c3d4-58cc-4372-a567-0e02b2c3d479';
const WORK_ITEM_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

describe('workItemStepNodeTransformer', () => {
  describe('a work item running a known step', () => {
    it('VALID: {codeweaver at `plan`} => the planner node, a prompt step with no handler', () => {
      const workItem = WorkItemStub({
        id: WORK_ITEM_ID,
        role: 'codeweaver',
        status: 'pending',
        step: 'plan',
        relatedDataItems: [`operations/${CODEWEAVER_OP_ID}`],
      });
      const quest = QuestStub({
        operations: [
          OperationItemStub({ id: CODEWEAVER_OP_ID, role: 'codeweaver', status: 'in_progress' }),
        ],
        workItems: [workItem],
      });

      const node = workItemStepNodeTransformer({ quest, workItem });

      expect({ role: node?.role, kind: node?.kind, handler: node?.handler }).toStrictEqual({
        role: 'planner',
        kind: 'prompt',
        handler: undefined,
      });
    });

    it('VALID: {codeweaver at `ward`} => a deterministic node carrying the ward handler and its two args', () => {
      const workItem = WorkItemStub({
        id: WORK_ITEM_ID,
        role: 'codeweaver',
        status: 'pending',
        step: 'ward',
        relatedDataItems: [`operations/${CODEWEAVER_OP_ID}`],
      });
      const quest = QuestStub({
        operations: [
          OperationItemStub({ id: CODEWEAVER_OP_ID, role: 'codeweaver', status: 'in_progress' }),
        ],
        workItems: [workItem],
      });

      const node = workItemStepNodeTransformer({ quest, workItem });

      expect({
        role: node?.role,
        kind: node?.kind,
        handler: node?.handler,
        args: node?.args?.map(String),
      }).toStrictEqual({
        role: 'reviewer',
        kind: 'deterministic',
        handler: 'ward',
        args: ['--committed', '--uncommitted'],
      });
    });
  });

  describe('a work item that runs no step graph', () => {
    it('EMPTY: {no `step` on the work item} => undefined, with no entry-step fallback', () => {
      const workItem = WorkItemStub({
        id: WORK_ITEM_ID,
        role: 'codeweaver',
        status: 'pending',
        relatedDataItems: [`operations/${CODEWEAVER_OP_ID}`],
      });
      const quest = QuestStub({
        operations: [
          OperationItemStub({ id: CODEWEAVER_OP_ID, role: 'codeweaver', status: 'in_progress' }),
        ],
        workItems: [workItem],
      });

      expect(workItemStepNodeTransformer({ quest, workItem })).toBe(undefined);
    });

    it('EMPTY: {a role no family carries} => undefined, because spiritmender runs no family graph', () => {
      const workItem = WorkItemStub({
        id: WORK_ITEM_ID,
        role: 'spiritmender',
        status: 'pending',
        step: 'plan',
        relatedDataItems: [`operations/${SPIRITMENDER_OP_ID}`],
      });
      const quest = QuestStub({
        operations: [
          OperationItemStub({
            id: SPIRITMENDER_OP_ID,
            role: 'spiritmender',
            status: 'in_progress',
          }),
        ],
        workItems: [workItem],
      });

      expect(workItemStepNodeTransformer({ quest, workItem })).toBe(undefined);
    });

    it('EMPTY: {a step name the family does not declare} => undefined rather than a throw', () => {
      const workItem = WorkItemStub({
        id: WORK_ITEM_ID,
        role: 'codeweaver',
        status: 'pending',
        step: 'retired-step',
        relatedDataItems: [`operations/${CODEWEAVER_OP_ID}`],
      });
      const quest = QuestStub({
        operations: [
          OperationItemStub({ id: CODEWEAVER_OP_ID, role: 'codeweaver', status: 'in_progress' }),
        ],
        workItems: [workItem],
      });

      expect(workItemStepNodeTransformer({ quest, workItem })).toBe(undefined);
    });

    it('EMPTY: {a work item linked to no operation item} => undefined, because it declares no scope', () => {
      const workItem = WorkItemStub({
        id: WORK_ITEM_ID,
        role: 'codeweaver',
        status: 'pending',
        step: 'plan',
      });
      const quest = QuestStub({ operations: [], workItems: [workItem] });

      expect(workItemStepNodeTransformer({ quest, workItem })).toBe(undefined);
    });
  });
});
