import {
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  QuestStub,
  QuestWorkItemIdStub,
  UnitObservationStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { signalGateTransformer } from './signal-gate-transformer';

const WORK_ITEM_ID = QuestWorkItemIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

const OBS_3 = 'send-flow:observable:obs-3';
const OBS_7 = 'send-flow:observable:obs-7';
const OBS_1 = 'send-flow:observable:obs-1';
const OBS_2 = 'send-flow:observable:obs-2';
const BRANCH_COPY_OK = 'send-flow:branch:copy-ok';
const TERMINAL_SENT = 'send-flow:terminal:sent';
const OFF_MAP_PERF = 'send-flow:off-map:perf';
const OFF_MAP_HOSTILE = 'send-flow:off-map:hostile-input';

// `compose` has an outgoing edge and `sent` has none, so `sent` is the flow's one terminal and
// `copy-ok` its one labelled branch. Every text in here is the text the refusal rows quote.
const SEND_FLOW = FlowStub({
  id: 'send-flow',
  name: 'Send Flow',
  flowType: 'runtime',
  nodes: [
    FlowNodeStub({
      id: 'compose',
      label: 'Compose',
      observables: [
        FlowObservableStub({
          id: 'obs-3',
          description: 'scanning the text finds every absolute path …',
        }),
        FlowObservableStub({
          id: 'obs-7',
          description: 'a path already inside an image token is not matched twice',
        }),
        FlowObservableStub({ id: 'obs-1', description: 'the composer accepts pasted text' }),
        FlowObservableStub({ id: 'obs-2', description: 'the send control enables on a draft' }),
      ],
    }),
    FlowNodeStub({ id: 'sent', label: 'Sent', observables: [] }),
  ],
  edges: [
    FlowEdgeStub({
      id: 'copy-ok',
      from: 'compose',
      to: 'sent',
      label: 'a successful copy reaches the rewrite',
    }),
  ],
});

const ASSIGNED_SEVEN = [OBS_3, OBS_7, BRANCH_COPY_OK, TERMINAL_SENT, OBS_1, OBS_2, OFF_MAP_PERF];

const CLOSING_LINES = [
  'Mark each one `met`, `cant-meet` or `unmet` through quest-work, then signal again.',
  '`unmet` is not failure and costs nothing — it mints your successor on exactly these.',
];

const OVERFLOW_IDS = Array.from(
  { length: 20 },
  (_unused, index) => `send-flow:observable:obs-${String(index + 1).padStart(2, '0')}`,
);

const OVERFLOW_FLOW = FlowStub({
  id: 'send-flow',
  name: 'Send Flow',
  flowType: 'runtime',
  nodes: [
    FlowNodeStub({
      id: 'compose',
      label: 'Compose',
      observables: Array.from({ length: 20 }, (_unused, index) =>
        FlowObservableStub({
          id: `obs-${String(index + 1).padStart(2, '0')}`,
          description: 'a unit the record does not settle',
        }),
      ),
    }),
  ],
  edges: [],
});

describe('signalGateTransformer', () => {
  describe('the arithmetic', () => {
    it('VALID: {7 assigned, 6 marked} => refuses and names the one unmarked id', () => {
      const quest = QuestStub({
        flows: [SEND_FLOW],
        workItems: [
          WorkItemStub({
            id: WORK_ITEM_ID,
            role: 'codeweaver',
            step: 'work',
            assignedUnitIds: ASSIGNED_SEVEN,
            observations: ASSIGNED_SEVEN.filter((unitId) => unitId !== BRANCH_COPY_OK).map(
              (unitId) => UnitObservationStub({ unitId, mark: 'met' }),
            ),
          }),
        ],
      });

      const result = signalGateTransformer({ quest, workItemId: WORK_ITEM_ID });

      expect(result).toStrictEqual({
        ok: false,
        unmarked: [BRANCH_COPY_OK],
        message: [
          'REFUSED: 1 of your 7 assigned units are unmarked.',
          '',
          '  send-flow:branch:copy-ok   a successful copy reaches the rewrite',
          '',
          ...CLOSING_LINES,
        ].join('\n'),
      });
    });

    it('VALID: {7 assigned, all 7 marked} => passes carrying no message key', () => {
      const quest = QuestStub({
        flows: [SEND_FLOW],
        workItems: [
          WorkItemStub({
            id: WORK_ITEM_ID,
            role: 'codeweaver',
            step: 'work',
            assignedUnitIds: ASSIGNED_SEVEN,
            observations: ASSIGNED_SEVEN.map((unitId) =>
              UnitObservationStub({ unitId, mark: 'met' }),
            ),
          }),
        ],
      });

      const result = signalGateTransformer({ quest, workItemId: WORK_ITEM_ID });

      expect(result).toStrictEqual({ ok: true });
    });

    it('EMPTY: {planner with assignedUnitIds: [], observations: []} => passes on the arithmetic alone', () => {
      const quest = QuestStub({
        flows: [SEND_FLOW],
        workItems: [
          WorkItemStub({
            id: WORK_ITEM_ID,
            role: 'codeweaver',
            step: 'plan',
            assignedUnitIds: [],
            observations: [],
          }),
        ],
      });

      const result = signalGateTransformer({ quest, workItemId: WORK_ITEM_ID });

      expect(result).toStrictEqual({ ok: true });
    });

    it('VALID: {siege planner carrying two plannerMarks units, both cant-meet} => passes', () => {
      const quest = QuestStub({
        flows: [SEND_FLOW],
        workItems: [
          WorkItemStub({
            id: WORK_ITEM_ID,
            role: 'siegemaster',
            step: 'plan',
            assignedUnitIds: [OFF_MAP_PERF, OFF_MAP_HOSTILE],
            observations: [
              UnitObservationStub({
                unitId: OFF_MAP_PERF,
                mark: 'cant-meet',
                evidence: 'no lane can drive this flow at a realistic data volume',
                toSettle: 'seed the lane with ten thousand rows and re-time the slowest path',
              }),
              UnitObservationStub({
                unitId: OFF_MAP_HOSTILE,
                mark: 'cant-meet',
                evidence: 'the flow carries no untrusted input toward a dangerous sink',
                toSettle: 'drive injection-shaped payloads once the flow accepts free text',
              }),
            ],
          }),
        ],
      });

      const result = signalGateTransformer({ quest, workItemId: WORK_ITEM_ID });

      expect(result).toStrictEqual({ ok: true });
    });

    it('VALID: {1 assigned, marked cant-meet} => counts as marked and passes', () => {
      const quest = QuestStub({
        flows: [SEND_FLOW],
        workItems: [
          WorkItemStub({
            id: WORK_ITEM_ID,
            assignedUnitIds: [OBS_3],
            observations: [
              UnitObservationStub({
                unitId: OBS_3,
                mark: 'cant-meet',
                evidence: 'the scan runs in a worker this layer cannot reach',
                toSettle: 'drive a real paste through a running composer and read the worker log',
              }),
            ],
          }),
        ],
      });

      const result = signalGateTransformer({ quest, workItemId: WORK_ITEM_ID });

      expect(result).toStrictEqual({ ok: true });
    });

    it('VALID: {1 assigned, marked unmet} => counts as marked and passes', () => {
      const quest = QuestStub({
        flows: [SEND_FLOW],
        workItems: [
          WorkItemStub({
            id: WORK_ITEM_ID,
            assignedUnitIds: [OBS_3],
            observations: [
              UnitObservationStub({
                unitId: OBS_3,
                mark: 'unmet',
                evidence: 'the scan finds relative paths only; the absolute branch is unwritten',
              }),
            ],
          }),
        ],
      });

      const result = signalGateTransformer({ quest, workItemId: WORK_ITEM_ID });

      expect(result).toStrictEqual({ ok: true });
    });
  });

  describe('the refusal message', () => {
    it('VALID: {7 assigned, 3 unmarked} => builds the refusal character for character', () => {
      const quest = QuestStub({
        flows: [SEND_FLOW],
        workItems: [
          WorkItemStub({
            id: WORK_ITEM_ID,
            role: 'codeweaver',
            step: 'work',
            assignedUnitIds: ASSIGNED_SEVEN,
            observations: [TERMINAL_SENT, OBS_1, OBS_2, OFF_MAP_PERF].map((unitId) =>
              UnitObservationStub({ unitId, mark: 'met' }),
            ),
          }),
        ],
      });

      const result = signalGateTransformer({ quest, workItemId: WORK_ITEM_ID });

      expect(result).toStrictEqual({
        ok: false,
        unmarked: [OBS_3, OBS_7, BRANCH_COPY_OK],
        message: [
          'REFUSED: 3 of your 7 assigned units are unmarked.',
          '',
          '  send-flow:observable:obs-3   scanning the text finds every absolute path …',
          '  send-flow:observable:obs-7   a path already inside an image token is not matched twice',
          '  send-flow:branch:copy-ok     a successful copy reaches the rewrite',
          '',
          ...CLOSING_LINES,
        ].join('\n'),
      });
    });

    it('EDGE: {20 unmarked} => prints 15 rows then the overflow line', () => {
      const quest = QuestStub({
        flows: [OVERFLOW_FLOW],
        workItems: [
          WorkItemStub({
            id: WORK_ITEM_ID,
            assignedUnitIds: OVERFLOW_IDS,
            observations: [],
          }),
        ],
      });

      const result = signalGateTransformer({ quest, workItemId: WORK_ITEM_ID });

      expect(result).toStrictEqual({
        ok: false,
        unmarked: OVERFLOW_IDS,
        message: [
          'REFUSED: 20 of your 20 assigned units are unmarked.',
          '',
          '  send-flow:observable:obs-01   a unit the record does not settle',
          '  send-flow:observable:obs-02   a unit the record does not settle',
          '  send-flow:observable:obs-03   a unit the record does not settle',
          '  send-flow:observable:obs-04   a unit the record does not settle',
          '  send-flow:observable:obs-05   a unit the record does not settle',
          '  send-flow:observable:obs-06   a unit the record does not settle',
          '  send-flow:observable:obs-07   a unit the record does not settle',
          '  send-flow:observable:obs-08   a unit the record does not settle',
          '  send-flow:observable:obs-09   a unit the record does not settle',
          '  send-flow:observable:obs-10   a unit the record does not settle',
          '  send-flow:observable:obs-11   a unit the record does not settle',
          '  send-flow:observable:obs-12   a unit the record does not settle',
          '  send-flow:observable:obs-13   a unit the record does not settle',
          '  send-flow:observable:obs-14   a unit the record does not settle',
          '  send-flow:observable:obs-15   a unit the record does not settle',
          '  … and 5 more — call get-quest-work({ questId, workItemId }) for the full set.',
          '',
          ...CLOSING_LINES,
        ].join('\n'),
      });
    });

    it('VALID: {off-map perf unmarked} => quotes the probe sentence truncated at 80 plus an ellipsis', () => {
      const quest = QuestStub({
        flows: [SEND_FLOW],
        workItems: [
          WorkItemStub({
            id: WORK_ITEM_ID,
            role: 'siegemaster',
            step: 'adversarial',
            assignedUnitIds: [OFF_MAP_PERF],
            observations: [],
          }),
        ],
      });

      const result = signalGateTransformer({ quest, workItemId: WORK_ITEM_ID });

      expect(result).toStrictEqual({
        ok: false,
        unmarked: [OFF_MAP_PERF],
        message: [
          'REFUSED: 1 of your 1 assigned units are unmarked.',
          '',
          '  send-flow:off-map:perf   Time the slowest realistic path end to end, count the requests or queries ONE us …',
          '',
          ...CLOSING_LINES,
        ].join('\n'),
      });
    });

    it('EDGE: {text of exactly 80 characters} => leaves it untouched', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'send-flow',
            name: 'Send Flow',
            nodes: [
              FlowNodeStub({
                id: 'compose',
                label: 'Compose',
                observables: [
                  FlowObservableStub({
                    id: 'obs-3',
                    description:
                      'eighty characters exactly, the longest text this row rule leaves fully untouched',
                  }),
                ],
              }),
            ],
            edges: [],
          }),
        ],
        workItems: [WorkItemStub({ id: WORK_ITEM_ID, assignedUnitIds: [OBS_3], observations: [] })],
      });

      const result = signalGateTransformer({ quest, workItemId: WORK_ITEM_ID });

      expect(result).toStrictEqual({
        ok: false,
        unmarked: [OBS_3],
        message: [
          'REFUSED: 1 of your 1 assigned units are unmarked.',
          '',
          '  send-flow:observable:obs-3   eighty characters exactly, the longest text this row rule leaves fully untouched',
          '',
          ...CLOSING_LINES,
        ].join('\n'),
      });
    });

    it('EDGE: {text of 81 characters} => truncates at 80 and appends an ellipsis', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'send-flow',
            name: 'Send Flow',
            nodes: [
              FlowNodeStub({
                id: 'compose',
                label: 'Compose',
                observables: [
                  FlowObservableStub({
                    id: 'obs-3',
                    description:
                      'a clipboard rewrite replaces every absolute path in the draft with an image token',
                  }),
                ],
              }),
            ],
            edges: [],
          }),
        ],
        workItems: [WorkItemStub({ id: WORK_ITEM_ID, assignedUnitIds: [OBS_3], observations: [] })],
      });

      const result = signalGateTransformer({ quest, workItemId: WORK_ITEM_ID });

      expect(result).toStrictEqual({
        ok: false,
        unmarked: [OBS_3],
        message: [
          'REFUSED: 1 of your 1 assigned units are unmarked.',
          '',
          '  send-flow:observable:obs-3   a clipboard rewrite replaces every absolute path in the draft with an image toke …',
          '',
          ...CLOSING_LINES,
        ].join('\n'),
      });
    });
  });

  describe('ids the enumeration does not produce', () => {
    it('EDGE: {assigned id no flow enumerates} => refuses with the id and an empty text column', () => {
      const quest = QuestStub({
        flows: [SEND_FLOW],
        workItems: [
          WorkItemStub({
            id: WORK_ITEM_ID,
            assignedUnitIds: ['send-flow:observable:ghost'],
            observations: [],
          }),
        ],
      });

      const result = signalGateTransformer({ quest, workItemId: WORK_ITEM_ID });

      expect(result).toStrictEqual({
        ok: false,
        unmarked: ['send-flow:observable:ghost'],
        message: [
          'REFUSED: 1 of your 1 assigned units are unmarked.',
          '',
          '  send-flow:observable:ghost   ',
          '',
          ...CLOSING_LINES,
        ].join('\n'),
      });
    });
  });

  describe('the reviewer rule', () => {
    it('VALID: {reviewer assigned its whole in-scope set} => refuses on the unit no piece ever claimed', () => {
      const inScope = [TERMINAL_SENT, BRANCH_COPY_OK, OBS_3, OBS_7, OBS_1, OBS_2];
      const quest = QuestStub({
        flows: [SEND_FLOW],
        workItems: [
          WorkItemStub({
            id: WORK_ITEM_ID,
            role: 'siegemaster',
            step: 'review',
            assignedUnitIds: inScope,
            observations: inScope
              .filter((unitId) => unitId !== OBS_2)
              .map((unitId) => UnitObservationStub({ unitId, mark: 'met' })),
          }),
        ],
      });

      const result = signalGateTransformer({ quest, workItemId: WORK_ITEM_ID });

      expect(result).toStrictEqual({
        ok: false,
        unmarked: [OBS_2],
        message: [
          'REFUSED: 1 of your 6 assigned units are unmarked.',
          '',
          '  send-flow:observable:obs-2   the send control enables on a draft',
          '',
          ...CLOSING_LINES,
        ].join('\n'),
      });
    });
  });

  describe('purity', () => {
    it('VALID: {a refused work item} => leaves the quest object exactly as it was', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'send-flow',
            name: 'Send Flow',
            nodes: [
              FlowNodeStub({
                id: 'compose',
                label: 'Compose',
                observables: [
                  FlowObservableStub({ id: 'obs-3', description: 'the scan finds every path' }),
                ],
              }),
            ],
            edges: [],
          }),
        ],
        workItems: [WorkItemStub({ id: WORK_ITEM_ID, assignedUnitIds: [OBS_3], observations: [] })],
      });
      const untouched = QuestStub({
        flows: [
          FlowStub({
            id: 'send-flow',
            name: 'Send Flow',
            nodes: [
              FlowNodeStub({
                id: 'compose',
                label: 'Compose',
                observables: [
                  FlowObservableStub({ id: 'obs-3', description: 'the scan finds every path' }),
                ],
              }),
            ],
            edges: [],
          }),
        ],
        workItems: [WorkItemStub({ id: WORK_ITEM_ID, assignedUnitIds: [OBS_3], observations: [] })],
      });

      signalGateTransformer({ quest, workItemId: WORK_ITEM_ID });

      expect(quest).toStrictEqual(untouched);
    });
  });

  describe('a work item the quest does not hold', () => {
    it('ERROR: {workItemId off the quest} => throws naming the quest and the id', () => {
      const quest = QuestStub({ flows: [SEND_FLOW], workItems: [] });

      expect(() => signalGateTransformer({ quest, workItemId: WORK_ITEM_ID })).toThrow(
        "signalGateTransformer: quest 'add-auth' holds no work item 'f47ac10b-58cc-4372-a567-0e02b2c3d479'",
      );
    });
  });
});
