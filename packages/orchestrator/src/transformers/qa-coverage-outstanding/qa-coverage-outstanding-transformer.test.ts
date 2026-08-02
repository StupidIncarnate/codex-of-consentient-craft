import {
  FlowStub,
  OperationItemStub,
  QuestQaLedgerEntryStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { qaCoverageOutstandingTransformer } from './qa-coverage-outstanding-transformer';

describe('qaCoverageOutstandingTransformer', () => {
  describe('siegemaster items with declared scope', () => {
    it('VALID: {empty ledger} => every unit on the scoped flow is outstanding', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'a-flow',
            nodes: [{ id: 'a-node', label: 'A node', type: 'state', observables: [] }],
            edges: [],
          }),
        ],
        planningNotes: { blightReports: [], qaLedger: [] },
      });

      expect(
        qaCoverageOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({ role: 'siegemaster', flowIds: ['a-flow'] }),
        }),
      ).toStrictEqual([
        'a-flow:terminal:a-node',
        'a-flow:off-map:re-entry',
        'a-flow:off-map:concurrency',
        'a-flow:off-map:interruption',
        'a-flow:off-map:staleness',
        'a-flow:off-map:configuration',
        'a-flow:off-map:hostile-input',
      ]);
    });

    it('VALID: {every unit dispositioned} => nothing outstanding, so done is allowed', () => {
      const flow = FlowStub({
        id: 'a-flow',
        nodes: [{ id: 'a-node', label: 'A node', type: 'state', observables: [] }],
        edges: [],
      });
      const allIds = [
        'a-flow:terminal:a-node',
        'a-flow:off-map:re-entry',
        'a-flow:off-map:concurrency',
        'a-flow:off-map:interruption',
        'a-flow:off-map:staleness',
        'a-flow:off-map:configuration',
        'a-flow:off-map:hostile-input',
      ];
      const quest = QuestStub({
        flows: [flow],
        planningNotes: {
          blightReports: [],
          qaLedger: allIds.map((itemId) => QuestQaLedgerEntryStub({ itemId })),
        },
      });

      expect(
        qaCoverageOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({ role: 'siegemaster', flowIds: ['a-flow'] }),
        }),
      ).toStrictEqual([]);
    });

    it('VALID: {only the other flow dispositioned} => this item stays outstanding', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'a-flow',
            nodes: [{ id: 'a-node', label: 'A node', type: 'state', observables: [] }],
            edges: [],
          }),
          FlowStub({
            id: 'b-flow',
            nodes: [{ id: 'b-node', label: 'B node', type: 'state', observables: [] }],
            edges: [],
          }),
        ],
        planningNotes: {
          blightReports: [],
          qaLedger: [QuestQaLedgerEntryStub({ itemId: 'b-flow:terminal:b-node' })],
        },
      });

      expect(
        qaCoverageOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({ role: 'siegemaster', flowIds: ['a-flow'] }),
        })[0],
      ).toBe('a-flow:terminal:a-node');
    });
  });

  describe('every disposition clears a unit', () => {
    it.each(['walked', 'fixed', 'routed', 'recorded', 'gap', 'unconfirmed'])(
      'VALID: {disposition: %s} => clears the unit, so the gate is always honestly satisfiable',
      (disposition) => {
        const quest = QuestStub({
          flows: [FlowStub({ id: 'a-flow', nodes: [], edges: [] })],
          planningNotes: {
            blightReports: [],
            qaLedger: [
              QuestQaLedgerEntryStub({
                itemId: 'a-flow:off-map:re-entry',
                disposition: disposition as never,
              }),
            ],
          },
        });

        expect(
          qaCoverageOutstandingTransformer({
            quest,
            operationItem: OperationItemStub({ role: 'siegemaster', flowIds: ['a-flow'] }),
          }),
        ).toStrictEqual([
          'a-flow:off-map:concurrency',
          'a-flow:off-map:interruption',
          'a-flow:off-map:staleness',
          'a-flow:off-map:configuration',
          'a-flow:off-map:hostile-input',
        ]);
      },
    );
  });

  describe('items the gate does not bind', () => {
    it('VALID: {non-siegemaster role} => never gated', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'a-flow',
            nodes: [{ id: 'a-node', label: 'A node', type: 'state', observables: [] }],
            edges: [],
          }),
        ],
        planningNotes: { blightReports: [], qaLedger: [] },
      });

      expect(
        qaCoverageOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({ role: 'flowrider', flowIds: ['a-flow'] }),
        }),
      ).toStrictEqual([]);
    });

    it('EMPTY: {siegemaster item declaring no flowIds} => not gated, so a flow-less quest and pre-gate items still complete', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'a-flow',
            nodes: [{ id: 'a-node', label: 'A node', type: 'state', observables: [] }],
            edges: [],
          }),
        ],
        planningNotes: { blightReports: [], qaLedger: [] },
      });

      expect(
        qaCoverageOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({ role: 'siegemaster', flowIds: [] }),
        }),
      ).toStrictEqual([]);
    });

    it('EMPTY: {flowId not on the quest} => contributes nothing outstanding', () => {
      const quest = QuestStub({
        flows: [FlowStub({ id: 'a-flow', nodes: [], edges: [] })],
        planningNotes: { blightReports: [], qaLedger: [] },
      });

      expect(
        qaCoverageOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({ role: 'siegemaster', flowIds: ['gone-flow'] }),
        }),
      ).toStrictEqual([]);
    });
  });

  describe('multi-flow scope', () => {
    it('VALID: {item covering two flows} => outstanding spans both', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({ id: 'a-flow', nodes: [], edges: [] }),
          FlowStub({ id: 'b-flow', nodes: [], edges: [] }),
        ],
        planningNotes: { blightReports: [], qaLedger: [] },
      });

      expect(
        qaCoverageOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({
            role: 'siegemaster',
            flowIds: ['a-flow', 'b-flow'],
          }),
        }),
      ).toStrictEqual([
        'a-flow:off-map:re-entry',
        'a-flow:off-map:concurrency',
        'a-flow:off-map:interruption',
        'a-flow:off-map:staleness',
        'a-flow:off-map:configuration',
        'a-flow:off-map:hostile-input',
        'b-flow:off-map:re-entry',
        'b-flow:off-map:concurrency',
        'b-flow:off-map:interruption',
        'b-flow:off-map:staleness',
        'b-flow:off-map:configuration',
        'b-flow:off-map:hostile-input',
      ]);
    });
  });
});
