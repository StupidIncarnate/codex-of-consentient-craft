import {
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  OperationItemStub,
  QuestStub,
  StepNameStub,
} from '@dungeonmaster/shared/contracts';

import { stepInScopeUnitsTransformer } from './step-in-scope-units-transformer';

// Two DIFFERENT package names, and BOTH nodes below are tagged. An UNTAGGED node's units stay in
// scope for every cell (`qa-units-in-package-scope-transformer.ts:87`), so a fixture leaving one
// bare passes the narrowing assertion without ever exercising the filter.
const WEB_PACKAGE = 'web-app';
const SERVER_PACKAGE = 'api-service';

describe('stepInScopeUnitsTransformer', () => {
  describe('the package narrowing', () => {
    it("VALID: {codeweaver review, packageNames: ['web-app']} => returns its own cell's units and no sibling cell's", () => {
      const flow = FlowStub({
        id: 'send-flow',
        flowType: 'runtime',
        nodes: [
          FlowNodeStub({
            id: 'web-node',
            label: 'Web Node',
            packages: [WEB_PACKAGE],
            observables: [
              FlowObservableStub({
                id: 'web-badge-counts-persisted',
                description: 'the badge counts persisted comments',
                package: WEB_PACKAGE,
              }),
            ],
          }),
          FlowNodeStub({
            id: 'server-node',
            label: 'Server Node',
            packages: [SERVER_PACKAGE],
            observables: [
              FlowObservableStub({
                id: 'server-persists-batch',
                description: 'the batch is persisted',
                package: SERVER_PACKAGE,
              }),
            ],
          }),
        ],
        edges: [],
      });
      const operationItem = OperationItemStub({
        id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        flowIds: ['send-flow'],
        packageNames: [WEB_PACKAGE],
      });
      const { id: operationItemId } = operationItem;
      const quest = QuestStub({ flows: [flow], operations: [operationItem] });

      const result = stepInScopeUnitsTransformer({
        quest,
        operationItemId,
        step: StepNameStub({ value: 'review' }),
      });

      expect(result).toStrictEqual([
        'send-flow:terminal:web-node',
        'send-flow:observable:web-badge-counts-persisted',
      ]);
    });
  });

  describe('the verification-method narrowing', () => {
    it('VALID: {observable with verifyByReading} => in codeweaver review and out of flowrider review', () => {
      const flow = FlowStub({
        id: 'send-flow',
        flowType: 'runtime',
        nodes: [
          FlowNodeStub({
            id: 'web-node',
            label: 'Web Node',
            packages: [WEB_PACKAGE],
            observables: [
              FlowObservableStub({
                id: 'imports-the-shared-limit',
                description: 'the widget imports the shared limit instead of inlining it',
                package: WEB_PACKAGE,
                verifyByReading: true,
              }),
              FlowObservableStub({
                id: 'badge-counts-persisted',
                description: 'the badge counts persisted comments',
                package: WEB_PACKAGE,
              }),
            ],
          }),
        ],
        edges: [],
      });
      const codeweaverItem = OperationItemStub({
        id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        flowIds: ['send-flow'],
        packageNames: [],
      });
      const flowriderItem = OperationItemStub({
        id: 'b2c3d4e5-58cc-4372-a567-0e02b2c3d479',
        role: 'flowrider',
        flowIds: ['send-flow'],
        packageNames: [],
      });
      const { id: codeweaverItemId } = codeweaverItem;
      const { id: flowriderItemId } = flowriderItem;
      const quest = QuestStub({ flows: [flow], operations: [codeweaverItem, flowriderItem] });

      const codeweaverScope = stepInScopeUnitsTransformer({
        quest,
        operationItemId: codeweaverItemId,
        step: StepNameStub({ value: 'review' }),
      });
      const flowriderScope = stepInScopeUnitsTransformer({
        quest,
        operationItemId: flowriderItemId,
        step: StepNameStub({ value: 'review' }),
      });

      expect(codeweaverScope).toStrictEqual([
        'send-flow:terminal:web-node',
        'send-flow:observable:imports-the-shared-limit',
        'send-flow:observable:badge-counts-persisted',
      ]);
      expect(flowriderScope).toStrictEqual([
        'send-flow:terminal:web-node',
        'send-flow:observable:badge-counts-persisted',
      ]);
    });
  });

  describe('the unit-kind narrowing', () => {
    it('VALID: {siegemaster adversarial} => returns the seven off-map families and nothing else', () => {
      const flow = FlowStub({
        id: 'send-flow',
        flowType: 'runtime',
        nodes: [
          FlowNodeStub({
            id: 'web-node',
            label: 'Web Node',
            packages: [WEB_PACKAGE],
            observables: [
              FlowObservableStub({
                id: 'badge-counts-persisted',
                description: 'the badge counts persisted comments',
                package: WEB_PACKAGE,
              }),
            ],
          }),
        ],
        edges: [],
      });
      const operationItem = OperationItemStub({
        id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
        role: 'siegemaster',
        flowIds: ['send-flow'],
        packageNames: [],
      });
      const { id: operationItemId } = operationItem;
      const quest = QuestStub({ flows: [flow], operations: [operationItem] });

      const result = stepInScopeUnitsTransformer({
        quest,
        operationItemId,
        step: StepNameStub({ value: 'adversarial' }),
      });

      expect(result).toStrictEqual([
        'send-flow:off-map:re-entry',
        'send-flow:off-map:concurrency',
        'send-flow:off-map:interruption',
        'send-flow:off-map:staleness',
        'send-flow:off-map:configuration',
        'send-flow:off-map:hostile-input',
        'send-flow:off-map:perf',
      ]);
    });
  });

  describe('the flow-type narrowing', () => {
    it('EMPTY: {siegemaster happyWalk on an operational flow} => returns no unit', () => {
      const flow = FlowStub({
        id: 'carve-flow',
        flowType: 'operational',
        nodes: [
          FlowNodeStub({
            id: 'worktree-carved',
            label: 'Worktree Carved',
            packages: [SERVER_PACKAGE],
            observables: [],
          }),
        ],
        edges: [],
      });
      const operationItem = OperationItemStub({
        id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
        role: 'siegemaster',
        flowIds: ['carve-flow'],
        packageNames: [],
      });
      const { id: operationItemId } = operationItem;
      const quest = QuestStub({ flows: [flow], operations: [operationItem] });

      const result = stepInScopeUnitsTransformer({
        quest,
        operationItemId,
        step: StepNameStub({ value: 'happyWalk' }),
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('a step with no declared scope', () => {
    it("VALID: {codeweaver 'work'} => returns the family's whole in-scope set unfiltered", () => {
      const flow = FlowStub({
        id: 'send-flow',
        flowType: 'operational',
        nodes: [
          FlowNodeStub({
            id: 'web-node',
            label: 'Web Node',
            packages: [WEB_PACKAGE],
            observables: [
              FlowObservableStub({
                id: 'imports-the-shared-limit',
                description: 'the widget imports the shared limit instead of inlining it',
                package: WEB_PACKAGE,
                verifyByReading: true,
              }),
            ],
          }),
        ],
        edges: [],
      });
      const operationItem = OperationItemStub({
        id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        flowIds: ['send-flow'],
        packageNames: [],
      });
      const { id: operationItemId } = operationItem;
      const quest = QuestStub({ flows: [flow], operations: [operationItem] });

      const result = stepInScopeUnitsTransformer({
        quest,
        operationItemId,
        step: StepNameStub({ value: 'work' }),
      });

      expect(result).toStrictEqual([
        'send-flow:terminal:web-node',
        'send-flow:observable:imports-the-shared-limit',
        'send-flow:off-map:re-entry',
        'send-flow:off-map:concurrency',
        'send-flow:off-map:interruption',
        'send-flow:off-map:staleness',
        'send-flow:off-map:configuration',
        'send-flow:off-map:hostile-input',
        'send-flow:off-map:perf',
      ]);
    });
  });

  describe('a role outside the three families', () => {
    it('EMPTY: {role: spiritmender} => returns no unit and does not throw', () => {
      const operationItem = OperationItemStub({
        id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
        role: 'spiritmender',
        flowIds: ['send-flow'],
        packageNames: [],
      });
      const { id: operationItemId } = operationItem;
      const quest = QuestStub({
        flows: [FlowStub({ id: 'send-flow', flowType: 'runtime', nodes: [], edges: [] })],
        operations: [operationItem],
      });

      const result = stepInScopeUnitsTransformer({
        quest,
        operationItemId,
        step: StepNameStub({ value: 'review' }),
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('an item declaring no flows', () => {
    it('EMPTY: {flowIds: []} => returns no unit', () => {
      const flow = FlowStub({
        id: 'send-flow',
        flowType: 'runtime',
        nodes: [
          FlowNodeStub({
            id: 'web-node',
            label: 'Web Node',
            packages: [WEB_PACKAGE],
            observables: [],
          }),
        ],
        edges: [],
      });
      const operationItem = OperationItemStub({
        id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        flowIds: [],
        packageNames: [],
      });
      const { id: operationItemId } = operationItem;
      const quest = QuestStub({ flows: [flow], operations: [operationItem] });

      const result = stepInScopeUnitsTransformer({
        quest,
        operationItemId,
        step: StepNameStub({ value: 'review' }),
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('an operationItemId on no ledger', () => {
    it('ERROR: {unknown operationItemId} => throws naming the quest and the id', () => {
      const operationItem = OperationItemStub({
        id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        flowIds: ['send-flow'],
        packageNames: [],
      });
      const { id: absentOperationItemId } = OperationItemStub({
        id: 'c3d4e5f6-58cc-4372-a567-0e02b2c3d479',
      });
      const quest = QuestStub({
        id: 'send-batch',
        flows: [FlowStub({ id: 'send-flow', flowType: 'runtime', nodes: [], edges: [] })],
        operations: [operationItem],
      });

      expect(() =>
        stepInScopeUnitsTransformer({
          quest,
          operationItemId: absentOperationItemId,
          step: StepNameStub({ value: 'review' }),
        }),
      ).toThrow(
        "stepInScopeUnitsTransformer: quest 'send-batch' holds no operation item 'c3d4e5f6-58cc-4372-a567-0e02b2c3d479'",
      );
    });
  });

  describe('purity', () => {
    it('VALID: {any quest} => leaves the quest byte-identical', () => {
      const flow = FlowStub({
        id: 'send-flow',
        flowType: 'runtime',
        nodes: [
          FlowNodeStub({
            id: 'web-node',
            label: 'Web Node',
            packages: [WEB_PACKAGE],
            observables: [
              FlowObservableStub({
                id: 'badge-counts-persisted',
                description: 'the badge counts persisted comments',
                package: WEB_PACKAGE,
              }),
            ],
          }),
        ],
        edges: [],
      });
      const operationItem = OperationItemStub({
        id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        flowIds: ['send-flow'],
        packageNames: [WEB_PACKAGE],
      });
      const { id: operationItemId } = operationItem;
      const quest = QuestStub({ flows: [flow], operations: [operationItem] });
      const before = JSON.stringify(quest);

      stepInScopeUnitsTransformer({
        quest,
        operationItemId,
        step: StepNameStub({ value: 'review' }),
      });

      expect(JSON.stringify(quest)).toBe(before);
    });
  });
});
