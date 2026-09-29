import { FlowEdgeStub } from '@dungeonmaster/shared/contracts/flow-edge/flow-edge.stub';
import { FlowNodeStub } from '@dungeonmaster/shared/contracts/flow-node/flow-node.stub';
import { FlowObservableStub } from '@dungeonmaster/shared/contracts/flow-observable/flow-observable.stub';
import { FlowStub } from '@dungeonmaster/shared/contracts/flow/flow.stub';
import { OperationItemStub } from '@dungeonmaster/shared/contracts/operation-item/operation-item.stub';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { UnitObservationStub } from '@dungeonmaster/shared/contracts/unit-observation/unit-observation.stub';
import { WorkItemStub } from '@dungeonmaster/shared/contracts/work-item/work-item.stub';
import { qaCheckSurfaceStatics } from '@dungeonmaster/shared/statics';

import { questWorkUnitsTransformer } from './quest-work-units-transformer';

const FLOW = FlowStub({
  id: 'send-flow',
  nodes: [
    FlowNodeStub({
      id: 'compose',
      label: 'Compose',
      type: 'decision',
      observables: [
        FlowObservableStub({
          id: 'scan-finds-every-path',
          type: 'file-exists',
          description: 'the scan finds every path',
        }),
        FlowObservableStub({
          id: 'send-button-is-orange',
          type: 'ui-state',
          description: 'SEND is the primary orange',
          verifyByReading: true,
        }),
      ],
    }),
    FlowNodeStub({ id: 'forward-unchanged', label: 'Forwarded unchanged' }),
  ],
  edges: [
    FlowEdgeStub({
      id: 'copy-failed',
      from: 'compose',
      to: 'forward-unchanged',
      label: 'copy failed',
    }),
  ],
});

const OPERATION_ITEM = OperationItemStub({ flowIds: ['send-flow'] });

describe('questWorkUnitsTransformer', () => {
  describe('surface', () => {
    it('VALID: {a terminal unit} => surface is the byKind.terminal sentence, byte for byte', () => {
      const result = questWorkUnitsTransformer({
        quest: QuestStub({ flows: [FLOW] }),
        operationItem: OPERATION_ITEM,
        unitIds: ['send-flow:terminal:forward-unchanged'] as never,
      });

      expect(result[0]?.surface).toBe(qaCheckSurfaceStatics.byKind.terminal);
    });

    it('VALID: {a branch unit} => surface is the byKind.branch sentence, byte for byte', () => {
      const result = questWorkUnitsTransformer({
        quest: QuestStub({ flows: [FLOW] }),
        operationItem: OPERATION_ITEM,
        unitIds: ['send-flow:branch:copy-failed'] as never,
      });

      expect(result[0]?.surface).toBe(qaCheckSurfaceStatics.byKind.branch);
    });

    it('VALID: {an off-map unit} => surface is the byKind off-map sentence, byte for byte', () => {
      const result = questWorkUnitsTransformer({
        quest: QuestStub({ flows: [FLOW] }),
        operationItem: OPERATION_ITEM,
        unitIds: ['send-flow:off-map:hostile-input'] as never,
      });

      expect(result[0]?.surface).toBe(qaCheckSurfaceStatics.byKind['off-map']);
    });

    it('VALID: {an observable} => surface is that outcome type’s own sentence', () => {
      const result = questWorkUnitsTransformer({
        quest: QuestStub({ flows: [FLOW] }),
        operationItem: OPERATION_ITEM,
        unitIds: ['send-flow:observable:scan-finds-every-path'] as never,
      });

      expect(result[0]?.surface).toBe(qaCheckSurfaceStatics.byOutcomeType['file-exists']);
    });

    it('VALID: {an observable carrying verifyByReading} => surface is readCheck, not its type’s sentence', () => {
      const result = questWorkUnitsTransformer({
        quest: QuestStub({ flows: [FLOW] }),
        operationItem: OPERATION_ITEM,
        unitIds: ['send-flow:observable:send-button-is-orange'] as never,
      });

      expect({
        surface: result[0]?.surface,
        verifyByReading: result[0]?.verifyByReading,
      }).toStrictEqual({
        surface: qaCheckSurfaceStatics.readCheck,
        verifyByReading: true,
      });
    });
  });

  describe('anchors', () => {
    it('VALID: {a terminal} => carries nodeId and a null edgeId', () => {
      const result = questWorkUnitsTransformer({
        quest: QuestStub({ flows: [FLOW] }),
        operationItem: OPERATION_ITEM,
        unitIds: ['send-flow:terminal:forward-unchanged'] as never,
      });

      expect({ nodeId: result[0]?.nodeId, edgeId: result[0]?.edgeId }).toStrictEqual({
        nodeId: 'forward-unchanged',
        edgeId: null,
      });
    });

    it('VALID: {a branch} => carries edgeId and a null nodeId', () => {
      const result = questWorkUnitsTransformer({
        quest: QuestStub({ flows: [FLOW] }),
        operationItem: OPERATION_ITEM,
        unitIds: ['send-flow:branch:copy-failed'] as never,
      });

      expect({ nodeId: result[0]?.nodeId, edgeId: result[0]?.edgeId }).toStrictEqual({
        nodeId: null,
        edgeId: 'copy-failed',
      });
    });

    it('VALID: {an observable} => carries the node it sits on, the antagonist’s row', () => {
      const result = questWorkUnitsTransformer({
        quest: QuestStub({ flows: [FLOW] }),
        operationItem: OPERATION_ITEM,
        unitIds: ['send-flow:observable:scan-finds-every-path'] as never,
      });

      expect({
        nodeId: result[0]?.nodeId,
        observableType: result[0]?.observableType,
      }).toStrictEqual({ nodeId: 'compose', observableType: 'file-exists' });
    });

    it('VALID: {an off-map family} => hangs on neither anchor', () => {
      const result = questWorkUnitsTransformer({
        quest: QuestStub({ flows: [FLOW] }),
        operationItem: OPERATION_ITEM,
        unitIds: ['send-flow:off-map:hostile-input'] as never,
      });

      expect({ nodeId: result[0]?.nodeId, edgeId: result[0]?.edgeId }).toStrictEqual({
        nodeId: null,
        edgeId: null,
      });
    });
  });

  describe('the current mark', () => {
    it('VALID: {a unit a previous work item marked cant-meet} => mark, evidence, toSettle and markedBy all ride along', () => {
      const quest = QuestStub({
        flows: [FLOW],
        workItems: [
          WorkItemStub({
            id: 'b2c3d4e5-58cc-4372-a567-0e02b2c3d479',
            assignedUnitIds: ['send-flow:observable:scan-finds-every-path'],
            observations: [
              UnitObservationStub({
                unitId: 'send-flow:observable:scan-finds-every-path',
                mark: 'cant-meet',
                evidence: 'no lane reaches the writer from here',
                toSettle: 'drive a real send and read the session JSONL',
                at: '2026-02-02T00:00:00.000Z',
              }),
            ],
          }),
        ],
      });

      const result = questWorkUnitsTransformer({
        quest,
        operationItem: OPERATION_ITEM,
        unitIds: ['send-flow:observable:scan-finds-every-path'] as never,
      });

      expect({
        mark: result[0]?.mark,
        evidence: result[0]?.evidence,
        toSettle: result[0]?.toSettle,
        markedBy: result[0]?.markedBy,
        markedAt: result[0]?.markedAt,
      }).toStrictEqual({
        mark: 'cant-meet',
        evidence: 'no lane reaches the writer from here',
        toSettle: 'drive a real send and read the session JSONL',
        markedBy: 'b2c3d4e5-58cc-4372-a567-0e02b2c3d479',
        markedAt: '2026-02-02T00:00:00.000Z',
      });
    });

    it('EMPTY: {a unit nothing has marked} => every mark field is null, never absent', () => {
      const result = questWorkUnitsTransformer({
        quest: QuestStub({ flows: [FLOW] }),
        operationItem: OPERATION_ITEM,
        unitIds: ['send-flow:terminal:forward-unchanged'] as never,
      });

      expect({
        mark: result[0]?.mark,
        evidence: result[0]?.evidence,
        toSettle: result[0]?.toSettle,
        markedBy: result[0]?.markedBy,
        markedAt: result[0]?.markedAt,
      }).toStrictEqual({
        mark: null,
        evidence: null,
        toSettle: null,
        markedBy: null,
        markedAt: null,
      });
    });
  });

  describe('ordering and misses', () => {
    it('VALID: {three ids} => rows come back in the order the ids were given', () => {
      const result = questWorkUnitsTransformer({
        quest: QuestStub({ flows: [FLOW] }),
        operationItem: OPERATION_ITEM,
        unitIds: [
          'send-flow:branch:copy-failed',
          'send-flow:terminal:forward-unchanged',
          'send-flow:observable:scan-finds-every-path',
        ] as never,
      });

      expect(result.map((unit) => String(unit.unitId))).toStrictEqual([
        'send-flow:branch:copy-failed',
        'send-flow:terminal:forward-unchanged',
        'send-flow:observable:scan-finds-every-path',
      ]);
    });

    it('EMPTY: {an id naming a flow the scope does not hold} => dropped rather than served blank', () => {
      const result = questWorkUnitsTransformer({
        quest: QuestStub({ flows: [FLOW] }),
        operationItem: OPERATION_ITEM,
        unitIds: ['other-flow:terminal:elsewhere'] as never,
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('verbatim text', () => {
    it('VALID: {an observable} => text is the description verbatim, never a paraphrase', () => {
      const result = questWorkUnitsTransformer({
        quest: QuestStub({ flows: [FLOW] }),
        operationItem: OPERATION_ITEM,
        unitIds: ['send-flow:observable:scan-finds-every-path'] as never,
      });

      expect(result[0]?.text).toBe('the scan finds every path');
    });

    it('VALID: {a terminal} => text is the node label verbatim', () => {
      const result = questWorkUnitsTransformer({
        quest: QuestStub({ flows: [FLOW] }),
        operationItem: OPERATION_ITEM,
        unitIds: ['send-flow:terminal:forward-unchanged'] as never,
      });

      expect(result[0]?.text).toBe('Forwarded unchanged');
    });
  });
});
